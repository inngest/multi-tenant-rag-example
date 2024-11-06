import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = neon(process.env.POSTGRES_URL as string);
  try {
    const workspaces = await sql`SELECT * FROM workspaces`;
    return NextResponse.json(workspaces);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}
