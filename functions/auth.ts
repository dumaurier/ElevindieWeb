import {
  handleAuthorizationGet,
  handleAuthorizationPost,
} from "./_lib/indieauth/authorize.js";
import type { Env } from "./_lib/github/types.js";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return handleAuthorizationGet(context.request, context.env);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  return handleAuthorizationPost(context.request, context.env);
};
