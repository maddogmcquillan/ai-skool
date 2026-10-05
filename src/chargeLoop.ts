import { buildMetaEvent, sendToMeta, type CapiConfig, type ChargeHook } from "./capi.js";
import { circleRequest, type CircleClientConfig } from "./circle.js";

/**
 * Purchases to Meta without Zapier. Every `intervalMs` the loop lists paid charges from Circle's
 * Admin API and sends each new one to the Meta Conversions API as a Purchase (or StartTrial when
 * nothing was paid), with the same event_id the paywall thank-you snippet computes in the
 * browser, so Meta counts each sale once.
 *
 * On start the loop looks back `lookbackMs` and (re)sends what it finds; Meta drops duplicates
 * by event_id, so a restart never double counts.
 *
 * Every poll is a billed Admin API call, so the default interval is an hour; a Circle workflow
 * webhook on POST /hooks/circle/nudge/meta sends a purchase within seconds instead.
 */
export interface ChargeLoopConfig {
  circle: CircleClientConfig;
  capi: CapiConfig;
  intervalMs: number;
  lookbackMs: number;
  /** Paywall display name -> internal name, the key the browser snippet uses in the event_id. */
  paywallKeys: Record<string, string>;
  /** Build the events but do not call Meta. */
  dryRun: boolean;
}

export interface ChargeLoopDeps {
  fetchImpl?: typeof fetch;
  now?: () => Date;
  log?: (message: string) => void;
}

export interface ChargeLoopStatus {
  enabled: true;
  ticks: number;
  sent: number;
  skipped: number;
  lastTickAt?: string;
  lastEventId?: string;
  lastError?: string;
}

export interface ChargeRecord {
  id: number;
  processor_id?: string | null;
  status?: string;
  /** Minor units: 4900 is $49.00. */
  amount?: number;
  currency?: string | null;
  created_at?: string;
  paywall_id?: number | null;
  paywall_name?: string | null;
  paywall_coupon_code?: string | null;
  community_member_name?: string | null;
  community_member_email?: string | null;
}

interface Paged<T> {
  records?: T[];
  has_next_page?: boolean;
}

/** The internal name for a paywall: from the map, else the display name slugified. */
export function paywallKeyFor(displayName: string | null | undefined, map: Record<string, string>): string {
  const name = (displayName ?? "").trim();
  const hit = Object.entries(map).find(([k]) => k.trim().toLowerCase() === name.toLowerCase());
  if (hit) return hit[1].trim();
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Every display name the founding paywall has had, all mapped to the key the thank-you snippet
 * hardcodes (`circle/paywall-thank-you-tracking.html`). Circle reports a charge under the
 * paywall's current display name, and a name missing here would slugify to a different key, so
 * the browser and server events would stop deduplicating and Meta would count each sale twice.
 * Add the new name here whenever the checkout title changes; the founding counter uses the same
 * list to decide which charges are founding families.
 */
export const DEFAULT_PAYWALL_KEYS: Readonly<Record<string, string>> = {
  "Founding Member": "founding-member",
  "Learn AI Founding Membership": "founding-member",
  "Back in School Access": "founding-member",
};

/** Parse `Founding Member=founding-member,Other Plan=other` over the built-in map. */
export function parsePaywallKeys(raw: string | undefined): Record<string, string> {
  const out: Record<string, string> = { ...DEFAULT_PAYWALL_KEYS };
  for (const pair of (raw ?? "").split(",")) {
    const [k, v] = pair.split("=");
    if (k?.trim() && v?.trim()) out[k.trim()] = v.trim();
  }
  return out;
}

export function chargeToHook(c: ChargeRecord, map: Record<string, string>): ChargeHook | null {
  const email = c.community_member_email?.trim();
  if (!email) return null;
  const [first, ...rest] = (c.community_member_name ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    email,
    first_name: first || undefined,
    last_name: rest.length ? rest.join(" ") : undefined,
    amount: (c.amount ?? 0) / 100,
    currency: c.currency ?? undefined,
    paywall_key: paywallKeyFor(c.paywall_name, map),
    charge_id: c.processor_id ?? String(c.id),
    paid_at: c.created_at,
  };
}

const SEEN_CAP = 5000;
const OVERLAP_MS = 15 * 60_000;

export class ChargeLoop {
  private seen = new Set<number>();
  private since: Date;
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;
  private again = false;
  private stats = { ticks: 0, sent: 0, skipped: 0 };
  private lastTickAt?: string;
  private lastEventId?: string;
  private lastError?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => Date;
  private readonly log: (message: string) => void;

  constructor(
    private readonly cfg: ChargeLoopConfig,
    deps: ChargeLoopDeps = {},
  ) {
    this.fetchImpl = deps.fetchImpl ?? fetch;
    this.now = deps.now ?? (() => new Date());
    this.log = deps.log ?? ((m) => console.log(`[meta] ${m}`));
    this.since = new Date(this.now().getTime() - cfg.lookbackMs);
  }

  status(): ChargeLoopStatus {
    return { enabled: true, ...this.stats, lastTickAt: this.lastTickAt, lastEventId: this.lastEventId, lastError: this.lastError };
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.tick(), this.cfg.intervalMs);
    void this.tick();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  /** Run a tick now (a webhook reported a charge); a tick in flight is followed by one more. */
  nudge(): void {
    if (this.busy) {
      this.again = true;
      return;
    }
    void this.tick();
  }

  async tick(): Promise<{ sent: number; skipped: number; failed: number }> {
    const result = { sent: 0, skipped: 0, failed: 0 };
    if (this.busy) return result;
    this.busy = true;
    try {
      this.stats.ticks++;
      this.lastTickAt = this.now().toISOString();
      let newest = this.since;
      for (const charge of await this.listPaidCharges(this.since)) {
        const created = charge.created_at ? new Date(charge.created_at) : undefined;
        if (created && !Number.isNaN(created.getTime()) && created > newest) newest = created;
        if (this.seen.has(charge.id)) continue;
        const outcome = await this.handle(charge);
        result[outcome]++;
      }
      this.since = new Date(Math.max(this.since.getTime(), newest.getTime() - OVERLAP_MS));
      if (this.seen.size > SEEN_CAP) this.seen = new Set([...this.seen].slice(-SEEN_CAP / 2));
      this.lastError = undefined;
    } catch (err) {
      this.lastError = (err as Error).message;
      this.log(`tick failed: ${this.lastError}`);
    } finally {
      this.busy = false;
      if (this.again) {
        this.again = false;
        void this.tick();
      }
    }
    return result;
  }

  private async listPaidCharges(since: Date): Promise<ChargeRecord[]> {
    const out: ChargeRecord[] = [];
    for (let page = 1; page <= 10; page++) {
      const qs = new URLSearchParams({ status: "paid", created_at_gte: since.toISOString(), page: String(page), per_page: "100" });
      const res = await circleRequest<Paged<ChargeRecord> | ChargeRecord[]>(this.cfg.circle, "GET", `/community_member_charges?${qs}`, undefined, this.fetchImpl);
      const records = Array.isArray(res) ? res : (res.records ?? []);
      out.push(...records);
      if (Array.isArray(res) || !res.has_next_page) break;
    }
    return out.sort((a, b) => Date.parse(a.created_at ?? "") - Date.parse(b.created_at ?? "") || a.id - b.id);
  }

  private async handle(charge: ChargeRecord): Promise<"sent" | "skipped" | "failed"> {
    if (charge.status && charge.status !== "paid") {
      this.seen.add(charge.id);
      this.stats.skipped++;
      return "skipped";
    }
    const hook = chargeToHook(charge, this.cfg.paywallKeys);
    if (!hook) {
      this.seen.add(charge.id);
      this.stats.skipped++;
      this.log(`skip charge ${charge.id}: no member email`);
      return "skipped";
    }
    const event = buildMetaEvent(hook, this.cfg.capi);
    if (this.cfg.dryRun) {
      this.seen.add(charge.id);
      this.stats.skipped++;
      this.log(`dry run, would send ${event.event_name} ${event.event_id} value ${event.custom_data.value}`);
      return "skipped";
    }
    try {
      const res = await sendToMeta([event], this.cfg.capi, this.fetchImpl);
      if (!res.ok) throw new Error(`Meta ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
      this.seen.add(charge.id);
      this.stats.sent++;
      this.lastEventId = event.event_id;
      this.log(`sent ${event.event_name} for charge ${charge.id} (${hook.paywall_key}, ${event.custom_data.value} ${event.custom_data.currency}) event_id ${event.event_id}`);
      return "sent";
    } catch (err) {
      this.log(`charge ${charge.id} failed: ${(err as Error).message}`);
      return "failed";
    }
  }
}
