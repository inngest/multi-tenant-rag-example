import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  embedContactWorkflow,
  enrichContactWorkflow,
} from "@/inngest/functions";

// This endpoint is used to trigger the enrichment and embedding workflows
//  see https://www.inngest.com/docs/learn/serving-inngest-functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [enrichContactWorkflow, embedContactWorkflow],
});
