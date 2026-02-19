import { handleMicropub } from "./_lib/handler.js";
import type { Env } from "./_lib/github/types.js";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  return handleMicropub(context.request, context.env);
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return handleMicropub(context.request, context.env);
};

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  return handleMicropub(context.request, context.env);
};
