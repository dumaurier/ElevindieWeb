import { handleTokenRequest } from "./_lib/indieauth/token.js";
import type { Env } from "./_lib/github/types.js";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  return handleTokenRequest(context.request, context.env);
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return handleTokenRequest(context.request, context.env);
};
