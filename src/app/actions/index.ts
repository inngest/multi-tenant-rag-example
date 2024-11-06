"use server";

import csv from "csvtojson";

import { inngest } from "@/inngest/client";
import loadVectorStore from "@/lib/vectorStore";

export async function uploadFile(formData: FormData) {
  const workspaceId = formData.get("workspaceId") as string;
  const file = formData.get("file") as File;
  const contactsFileContent = await file.text();

  const contacts = await csv().fromString(contactsFileContent);
  await inngest.send(
    contacts.map((contact) => ({
      name: "contacts/enrich",
      data: {
        contact,
        workspaceId,
      },
    }))
  );
}

export async function searchContacts(query: string, workspaceId: string) {
  const vectorStore = await loadVectorStore(workspaceId);
  const results = await vectorStore.similaritySearchWithScore(query, 3);

  return results.map((result) => result[0].pageContent);
}
