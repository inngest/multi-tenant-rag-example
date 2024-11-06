import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const contact = await req.json();

  await inngest.send({
    name: "contact.uploaded",
    data: contact,
  });

  return NextResponse.json({ success: true });
}
