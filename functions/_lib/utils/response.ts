export function created(location: string): Response {
  return new Response(null, {
    status: 201,
    headers: { Location: location },
  });
}

export function ok(body?: object): Response {
  if (body) {
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(null, { status: 200 });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function json(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
