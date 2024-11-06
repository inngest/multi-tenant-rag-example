import { inngest } from "./client";
import { neon } from "@neondatabase/serverless";
import { ChatOpenAI } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import loadVectorStore from "@/lib/vectorStore";
import { getTenantConnectionString } from "@/lib/neon-tenant";
import { NonRetriableError } from "inngest";

const llm = new ChatOpenAI({
  modelName: "gpt-4",
});

export const enrichContactWorkflow = inngest.createFunction(
  {
    id: "enrich-contact",
    throttle: {
      limit: 10,
      period: "10s",
      key: "event.data.workspaceId",
    },
  },
  { event: "contacts/enrich" },
  async ({ event, step }) => {
    const companyInfo = await step.run("fetch-company-info", async () => {
      const response = await fetch(
        `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
          event.data.contact.company + " company info"
        )}&api_key=${process.env.SERP_API_KEY}`
      );

      const data = await response.json();

      return {
        description: data.knowledge_graph?.description || "",
        website: data.knowledge_graph?.website || "",
        founded: data.knowledge_graph?.founded || "",
        headquarters: data.knowledge_graph?.headquarters || "",
        industry: data.knowledge_graph?.industry || "",
        size: data.knowledge_graph?.employees || "",
      };
    });

    const enrichedProfile = await step.run("generate-profile", async () => {
      const completion = await llm.invoke(
        `You are a contact enrichment assistant. Create a detailed professional profile based on the provided information.
        
        Contact Information:
        Name: ${event.data.contact.name}
        Company: ${event.data.contact.company}
        Role: ${event.data.contact.position}
        
        Company Information:
        Description: ${companyInfo.description}
        Industry: ${companyInfo.industry}
        Size: ${companyInfo.size}
        Headquarters: ${companyInfo.headquarters}
        Founded: ${companyInfo.founded}
        Website: ${companyInfo.website}
        
        Please provide a comprehensive professional profile.`
      );

      return completion.content as string;
    });

    const contactRecord = await step.run("insert-contact", async () => {
      const uri = await getTenantConnectionString(event.data.workspaceId);
      const sql = uri ? neon(uri) : null;

      if (!sql) {
        throw new NonRetriableError("Couldn't connect to Neon tenant");
      }
      return await sql`
          INSERT INTO contacts (name, company, role, enriched_profile)
          VALUES (${event.data.contact.firstName}, ${event.data.contact.company}, ${event.data.contact.position}, ${enrichedProfile})
          RETURNING id
        `;
    });

    const document = await step.run("generate-embedding", async () => {
      // Create a rich text representation including company details
      const enrichedContactText = `
          Contact Name: ${event.data.contact.firstName} ${event.data.contact.lastName}
          Role: ${event.data.contact.position}
          Company: ${event.data.contact.company}
          Industry: ${companyInfo.industry}
          Company Description: ${companyInfo.description}
          Company Size: ${companyInfo.size}
          Headquarters: ${companyInfo.headquarters}
          Founded: ${companyInfo.founded}
        `.trim();

      return new Document({
        pageContent: enrichedContactText,
        metadata: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          contactId: (contactRecord as any)["id"],
          name: event.data.contact.name,
          company: event.data.contact.company,
          role: event.data.contact.position,
          ...companyInfo,
        },
      });
    });

    await step.run("trigger-embed", async () => {
      await inngest.send({
        name: "contacts/embed",
        data: {
          document,
          workspaceId: event.data.workspaceId,
        },
      });
    });

    return { success: true };
  }
);

export const embedContactWorkflow = inngest.createFunction(
  {
    id: "embed-contact",
    batchEvents: {
      maxSize: 100,
      timeout: "60s",
      key: "event.data.workspaceId",
    },
  },
  { event: "contacts/embed" },
  async ({ events, step }) => {
    const vectorStore = await loadVectorStore(events[0].data.workspaceId);

    await step.run("embed-contacts", async () => {
      await vectorStore.addDocuments(events.map((e) => e.data.document));
    });
  }
);
