import { invalidRequest } from "./errors.js";

export interface MicropubRequest {
  action?: "update" | "delete" | "undelete";
  type: string;
  url?: string;
  properties: Record<string, string[]>;
  replace?: Record<string, string[]>;
  add?: Record<string, string[]>;
  delete?: Record<string, string[]> | string[];
}

export async function parseBody(request: Request): Promise<MicropubRequest> {
  const contentType = request.headers.get("Content-Type") || "";

  if (contentType.includes("application/json")) {
    return parseJsonBody(request);
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return parseFormBody(request);
  }

  // Default to form-encoded if no content type (some clients omit it)
  return parseFormBody(request);
}

async function parseJsonBody(request: Request): Promise<MicropubRequest> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    throw invalidRequest("Invalid JSON body");
  }

  if (body.action) {
    return {
      action: body.action,
      type: Array.isArray(body.type) ? body.type[0] : (body.type || "h-entry"),
      url: body.url,
      properties: body.properties || {},
      replace: body.replace,
      add: body.add,
      delete: body.delete,
    };
  }

  const type = Array.isArray(body.type) ? body.type[0] : (body.type || "h-entry");
  const properties: Record<string, string[]> = {};

  if (body.properties) {
    for (const [key, value] of Object.entries(body.properties)) {
      properties[key] = Array.isArray(value) ? value : [value as string];
    }
  }

  return { type, properties };
}

async function parseFormBody(request: Request): Promise<MicropubRequest> {
  const text = await request.text();
  const params = new URLSearchParams(text);

  const action = params.get("action") as MicropubRequest["action"] | null;
  const h = params.get("h") || "entry";
  const type = `h-${h}`;
  const url = params.get("url") || undefined;

  const properties: Record<string, string[]> = {};

  for (const [key, value] of params.entries()) {
    if (["h", "action", "url", "access_token"].includes(key)) continue;
    if (key.startsWith("mp-")) continue;

    const cleanKey = key.replace(/\[\]$/, "");

    if (!properties[cleanKey]) {
      properties[cleanKey] = [];
    }
    properties[cleanKey].push(value);
  }

  return {
    action: action || undefined,
    type,
    url,
    properties,
  };
}
