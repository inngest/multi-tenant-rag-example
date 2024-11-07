import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

import { neonApiClient, getTenantConnectionString } from "@/lib/neon-tenant";
import { setupTenantSchema } from "@/lib/neon-tenant/setup";

const NUMBER_OF_WORKSPACES = 2;

// The workspaces <> neon project relationship is stored in the global database's `workspaces` table
async function seed() {
  async function createProject() {
    const { data } = await neonApiClient.POST("/projects", {
      body: {
        project: {},
      },
    });
    return data?.project.id;
  }

  const tenantPromises = [...Array(NUMBER_OF_WORKSPACES)].map(async () => {
    const projectId = await createProject();
    const uri = await getTenantConnectionString(projectId!);
    const tenantClient = neon(uri!);
    await setupTenantSchema(tenantClient);
    return projectId;
  });

  const globalClient = neon(process.env.POSTGRES_URL as string);

  const projectIds = await Promise.all(tenantPromises);
  for (let i = 0; i < projectIds.length; i++) {
    await globalClient(
      `INSERT INTO workspaces (name, project_id) VALUES ($1, $2)`,
      [`Workspace ${i + 1}`, projectIds[i]]
    );
  }
}

// This endpoint is used to setup the database and the workspaces
export async function GET() {
  await seed();
  return NextResponse.json({ message: "done" });
}
