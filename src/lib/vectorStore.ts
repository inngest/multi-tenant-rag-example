import { NeonPostgres } from "@langchain/community/vectorstores/neon";
import { OpenAIEmbeddings } from "@langchain/openai";
import { getTenantConnectionString } from "./neon-tenant";

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  dimensions: 512,
  model: "text-embedding-3-small",
});

// Each workspace has its own vector store
export default async function loadVectorStore(workspaceId: string) {
  const connectionString = await getTenantConnectionString(workspaceId);

  if (!connectionString) {
    throw new Error("Couldn't connect to Neon tenant");
  }

  return await NeonPostgres.initialize(embeddings, {
    connectionString,
    tableName: "embeddings",
    columns: {
      contentColumnName: "content",
      metadataColumnName: "metadata",
      vectorColumnName: "embedding",
    },
  });
}
