import { handleWebhook } from "./_lib/handlers/webhook.js";
import type { Env } from "./_lib/github/types.js";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  return handleWebhook(context.request, context.env, context.waitUntil.bind(context));
};
