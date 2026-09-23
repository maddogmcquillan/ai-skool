import { normalizeEmail, purchaseEventId, sha256Hex } from "./lib/eventId.js";

/** Payload the Zapier "New Member Paid Charge" Zap posts to /hooks/circle/charge. */
export interface ChargeHook {
  email: string;
  first_name?: string;
  last_name?: string;
  /** Amount actually paid, e.g. 50 or "50.00". Zero means a free trial started. */
  amount: number | string;
  currency?: string;
  /** Must equal the paywall's internal name in Circle so the browser and server event_ids match. */
  paywall_key: string;
  charge_id?: string;
  /** ISO timestamp of the charge. Defaults to now. */
  paid_at?: string;
  client_ip?: string;
  user_agent?: string;
  fbp?: string;
  fbc?: string;
  event_source_url?: string;
  /** Optional Zapier-computed flag; when false the event is still sent but tagged as a renewal. */
  is_first_charge?: boolean;
}

export interface MetaEvent {
  event_name: "Purchase" | "StartTrial";
  event_time: number;
  event_id: string;
  event_source_url: string;
  action_source: "website";
  user_data: Record<string, string | string[]>;
  custom_data: Record<string, string | number>;
}

export interface CapiConfig {
  pixelId: string;
  accessToken: string;
  apiVersion: string;
  defaultSourceUrl: string;
  currency: string;
  testEventCode?: string;
}

export function parseAmount(raw: number | string | undefined): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (!raw) return 0;
  const n = parseFloat(String(raw).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function hashField(value: string | undefined): string | undefined {
  const v = value?.trim().toLowerCase();
  return v ? sha256Hex(v) : undefined;
}

export function buildMetaEvent(hook: ChargeHook, cfg: Pick<CapiConfig, "defaultSourceUrl" | "currency">): MetaEvent {
  const amount = parseAmount(hook.amount);
  const when = hook.paid_at ? new Date(hook.paid_at) : new Date();
  const eventTime = Number.isNaN(when.getTime()) ? new Date() : when;
  const email = normalizeEmail(hook.email);

  const user_data: Record<string, string | string[]> = {
    em: [sha256Hex(email)],
    external_id: [sha256Hex(email)],
  };
  const fn = hashField(hook.first_name);
  const ln = hashField(hook.last_name);
  if (fn) user_data.fn = [fn];
  if (ln) user_data.ln = [ln];
  if (hook.client_ip) user_data.client_ip_address = hook.client_ip;
  if (hook.user_agent) user_data.client_user_agent = hook.user_agent;
  if (hook.fbp) user_data.fbp = hook.fbp;
  if (hook.fbc) user_data.fbc = hook.fbc;

  const custom_data: Record<string, string | number> = {
    currency: (hook.currency || cfg.currency || "USD").toUpperCase(),
    value: amount,
    content_name: hook.paywall_key,
    content_type: "product",
    charge_kind: hook.is_first_charge === false ? "renewal" : "initial",
  };
  if (hook.charge_id) custom_data.order_id = hook.charge_id;

  return {
    event_name: amount > 0 ? "Purchase" : "StartTrial",
    event_time: Math.floor(eventTime.getTime() / 1000),
    event_id: purchaseEventId(hook.email, hook.paywall_key, eventTime),
    event_source_url: hook.event_source_url || cfg.defaultSourceUrl,
    action_source: "website",
    user_data,
    custom_data,
  };
}

export function metaEventsUrl(cfg: Pick<CapiConfig, "apiVersion" | "pixelId">): string {
  return `https://graph.facebook.com/${cfg.apiVersion}/${cfg.pixelId}/events`;
}

export async function sendToMeta(
  events: MetaEvent[],
  cfg: CapiConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const body: Record<string, unknown> = { data: events, access_token: cfg.accessToken };
  if (cfg.testEventCode) body.test_event_code = cfg.testEventCode;
  const res = await fetchImpl(metaEventsUrl(cfg), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    parsed = await res.text().catch(() => null);
  }
  return { ok: res.ok, status: res.status, body: parsed };
}
