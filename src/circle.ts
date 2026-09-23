/** Minimal Circle Admin API v2 client. Requires the Business plan or above. */
export interface CircleClientConfig {
  token: string;
  baseUrl?: string;
}

export interface CreateCommentInput {
  postId: number;
  body: string;
  parentCommentId?: number;
  skipNotifications?: boolean;
}

/**
 * Circle documents `Authorization: Bearer <token>` for Admin API v2, while its OpenAPI spec
 * lists `Authorization: Token <token>`. We try Bearer first and fall back to Token on a 401,
 * then remember whichever scheme worked for the rest of the process.
 */
let authScheme: "Bearer" | "Token" = "Bearer";

/** Test hook: reset the remembered auth scheme. */
export function resetAuthScheme(): void {
  authScheme = "Bearer";
}

export async function circleRequest<T>(
  cfg: CircleClientConfig,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  payload?: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const base = (cfg.baseUrl ?? "https://app.circle.so/api/admin/v2").replace(/\/$/, "");
  const send = (scheme: "Bearer" | "Token") =>
    fetchImpl(`${base}${path}`, {
      method,
      headers: {
        authorization: `${scheme} ${cfg.token}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
  let res = await send(authScheme);
  if (res.status === 401 && authScheme === "Bearer") {
    const retry = await send("Token");
    if (retry.status !== 401) {
      authScheme = "Token";
      res = retry;
    }
  }
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    throw new Error(`Circle API ${method} ${path} failed (${res.status}): ${typeof json === "string" ? json : JSON.stringify(json)}`);
  }
  return json as T;
}

export function createCircleComment(cfg: CircleClientConfig, input: CreateCommentInput, fetchImpl?: typeof fetch) {
  return circleRequest<{ id?: number }>(
    cfg,
    "POST",
    "/comments",
    {
      post_id: input.postId,
      body: input.body,
      parent_comment_id: input.parentCommentId,
      skip_notifications: input.skipNotifications ?? false,
    },
    fetchImpl,
  );
}
