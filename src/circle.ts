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

export async function circleRequest<T>(
  cfg: CircleClientConfig,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  payload?: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const base = (cfg.baseUrl ?? "https://app.circle.so/api/admin/v2").replace(/\/$/, "");
  const res = await fetchImpl(`${base}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${cfg.token}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
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
