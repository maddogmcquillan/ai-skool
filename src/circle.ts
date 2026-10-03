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

/**
 * Every request sent to Circle since the process started. Circle bills Admin API calls above
 * the plan's monthly allowance (5,000 on Business, $0.005 each beyond it), so /healthz reports
 * the count and the monthly rate it implies. The 401 retry below is a second call, as billed.
 */
const calls = { total: 0, since: Date.now(), byPath: new Map<string, number>() };

export interface CircleCallStats {
  total: number;
  since: string;
  /** Calls a day at the rate seen since `since`; a projection that settles after the first hour. */
  perDay: number;
  perMonth: number;
  /** `GET /posts`, `GET /comments`, ... without query strings. */
  byPath: Record<string, number>;
}

export function circleCallStats(now: number = Date.now()): CircleCallStats {
  const elapsedMs = Math.max(now - calls.since, 3_600_000);
  const perDay = Math.round((calls.total / elapsedMs) * 86_400_000);
  return { total: calls.total, since: new Date(calls.since).toISOString(), perDay, perMonth: perDay * 30, byPath: Object.fromEntries(calls.byPath) };
}

/** Test hook: forget the calls counted so far. */
export function resetCircleCallStats(now: number = Date.now()): void {
  calls.total = 0;
  calls.since = now;
  calls.byPath.clear();
}

function countCall(method: string, path: string): void {
  const key = `${method} ${path.split("?")[0]}`;
  calls.total++;
  calls.byPath.set(key, (calls.byPath.get(key) ?? 0) + 1);
}

export async function circleRequest<T>(
  cfg: CircleClientConfig,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  payload?: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const base = (cfg.baseUrl ?? "https://app.circle.so/api/admin/v2").replace(/\/$/, "");
  const send = (scheme: "Bearer" | "Token") => {
    countCall(method, path);
    return fetchImpl(`${base}${path}`, {
      method,
      headers: {
        authorization: `${scheme} ${cfg.token}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
  };
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

/**
 * Most Admin API v2 create endpoints return the new record directly, but a few wrap it:
 * `POST /spaces` answers `{ success, message, space: {...} }`. Return the record in either
 * shape, and fail with the raw body when neither carries a numeric id, so a surprising shape
 * surfaces here instead of as a confusing "Missing record" on the next request.
 */
export function unwrapRecord<T extends { id: number }>(res: unknown, key: string): T {
  const top = res as Record<string, unknown> | null;
  const candidate = top && typeof top.id === "number" ? top : (top?.[key] as Record<string, unknown> | undefined);
  if (!candidate || typeof candidate.id !== "number") {
    throw new Error(`Circle API response has no "${key}" record with an id: ${JSON.stringify(res).slice(0, 300)}`);
  }
  return candidate as unknown as T;
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
