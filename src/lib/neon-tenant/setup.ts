import { NeonQueryFunction } from "@neondatabase/serverless";

export async function setupTenantSchema(sql: NeonQueryFunction<false, false>) {
  // Create vector extension
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  // Create contacts table
  await sql`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      enriched_profile TEXT,    
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create embeddings table
  await sql`
    CREATE TABLE IF NOT EXISTS "embeddings" (
      "id" serial PRIMARY KEY NOT NULL,
      "content" text NOT NULL,
      "metadata" jsonb NOT NULL,
      "embedding" vector(512),
      "created_at" timestamp with time zone DEFAULT now(),
      "updated_at" timestamp with time zone DEFAULT now()
    )
  `;

  // Create HNSW index for embeddings
  await sql`
    CREATE INDEX IF NOT EXISTS "embedding_idx" 
    ON "embeddings" 
    USING hnsw ("embedding" vector_cosine_ops)
  `;

  return sql;
}
