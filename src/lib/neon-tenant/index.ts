import createClient from "openapi-fetch";
import type { paths } from "./api-schema";
import { neon } from "@neondatabase/serverless";

export const neonApiClient = createClient<paths>({
  baseUrl: "https://console.neon.tech/api/v2/",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.NEON_API_KEY}`,
  },
});
// Each workspace has its own database, and this function returns the connection string for a given workspace
export async function getTenantConnectionString(workspaceId: string) {
  const sql = neon(process.env.POSTGRES_URL as string);

  console.log("getTenantConnectionString", workspaceId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records: any = await sql(
    `SELECT project_id FROM workspaces WHERE id = ${workspaceId}`
  );

  if (records && records[0] && records[0]["project_id"]) {
    const { data } = await neonApiClient.GET(
      "/projects/{project_id}/connection_uri",
      {
        params: {
          path: {
            project_id: records[0]["project_id"],
          },
          query: {
            role_name: "neondb_owner",
            database_name: "neondb",
          },
        },
      }
    );
    return data?.uri;
  } else {
    throw new Error("Unable to load tenant");
  }
}
