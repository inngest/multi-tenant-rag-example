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

// Each contact is enriched via this workflow
export const enrichContactWorkflow = inngest.createFunction(
  {
    id: "enrich-contact",
    // The workflow is throttled to 10 concurrent executions every 10 seconds per workspace
    throttle: {
      limit: 10,
      period: "10s",
      // The throttling is applied per workspace to ensure guaranteed capacity
      key: "event.data.workspaceId",
    },
  },
  { event: "contacts/enrich" },
  async ({ event, step }) => {
    // First, we fetch the company information from the SERP API
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

    // Next, we generate a detailed professional profile for the contact
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
      // we fetch the database URI of the associated workspace
      const uri = await getTenantConnectionString(event.data.workspaceId);
      const sql = uri ? neon(uri) : null;

      if (!sql) {
        // Note: if the associated workspace does not exist, we don't retry the enrichment
        throw new NonRetriableError("Couldn't connect to Neon tenant");
      }
      return await sql`
          INSERT INTO contacts (name, company, role, enriched_profile)
          VALUES (${event.data.contact.firstName}, ${event.data.contact.company}, ${event.data.contact.position}, ${enrichedProfile})
          RETURNING id
        `;
    });

    // We generate an embedding document for the contact
    const document = await step.run("generate-embedding", async () => {
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

    // Finally, we trigger the embedding workflow
    await step.run("trigger-embed", async () => {
      await inngest.send({
        name: "contacts/embed",
        data: {
          document,
          // forwarding the workspaceId is important to ensure the proper data isolation
          workspaceId: event.data.workspaceId,
        },
      });
    });

    return { success: true };
  }
);

// Each batch of contacts is embedded via this workflow
export const embedContactWorkflow = inngest.createFunction(
  {
    id: "embed-contact",
    // The batch is throttled to 100 contacts every 60 seconds per workspace
    batchEvents: {
      maxSize: 100,
      timeout: "60s",
      // Contacts are grouped by workspace to be saved in the proper vector store
      key: "event.data.workspaceId",
    },
  },
  { event: "contacts/embed" },
  async ({ events, step }) => {
    // we get the vector store dedicated to the workspace
    const vectorStore = await loadVectorStore(events[0].data.workspaceId);

    await step.run("embed-contacts", async () => {
      await vectorStore.addDocuments(events.map((e) => e.data.document));
    });
  }
);
