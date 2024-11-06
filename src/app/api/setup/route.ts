import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

import { neonApiClient, getTenantConnectionString } from "@/lib/neon-tenant";
import { setupTenantSchema } from "@/lib/neon-tenant/setup";

async function seed() {
  async function createProject() {
    const { data } = await neonApiClient.POST("/projects", {
      body: {
        project: {},
      },
    });
    return data?.project.id;
  }

  const tenantPromises = [1, 2].map(async () => {
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

export async function GET() {
  await seed();
  return NextResponse.json({ message: "done" });
}
