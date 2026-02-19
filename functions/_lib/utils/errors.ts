export class MicropubError extends Error {
  constructor(
    public readonly errorType: string,
    public readonly description: string,
    public readonly statusCode: number = 400
  ) {
    super(description);
  }

  toResponse(): Response {
    return new Response(
      JSON.stringify({
        error: this.errorType,
        error_description: this.description,
      }),
      {
        status: this.statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export function unauthorized(description = "Missing access token"): MicropubError {
  return new MicropubError("unauthorized", description, 401);
}

export function forbidden(description = "Forbidden"): MicropubError {
  return new MicropubError("forbidden", description, 403);
}

export function insufficientScope(description = "Insufficient scope"): MicropubError {
  return new MicropubError("insufficient_scope", description, 403);
}

export function invalidRequest(description: string): MicropubError {
  return new MicropubError("invalid_request", description, 400);
}
