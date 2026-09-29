import { circleRequest, type CircleClientConfig } from "./circle.js";

/**
 * How many families are on the founding rate, for the "spots taken" bar on the landing pages.
 * Counts distinct paying members across Circle's paid charges (one family can have several
 * charges), caches the answer for `ttlMs`, and keeps serving the last good answer if Circle
 * is briefly unreachable.
 */
export interface FoundingConfig {
  circle: CircleClientConfig;
  /** Founding spots on offer, as printed on the page. */
  cap: number;
  ttlMs: number;
  /** Only count charges on this paywall; empty counts every paid charge. */
  paywallName?: string;
}

export interface FoundingSpots {
  cap: number;
  taken: number;
  updatedAt: string;
}

interface ChargeLite {
  id: number;
  status?: string;
  paywall_name?: string | null;
  community_member_id?: number | null;
  community_member_email?: string | null;
}

interface Paged<T> {
  records?: T[];
  has_next_page?: boolean;
}

export class FoundingCounter {
  private cached?: FoundingSpots;
  private fetchedAt = 0;
  private inflight?: Promise<FoundingSpots>;

  constructor(
    private readonly cfg: FoundingConfig,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {}

  async spots(): Promise<FoundingSpots> {
    if (this.cached && this.now() - this.fetchedAt < this.cfg.ttlMs) return this.cached;
    if (!this.inflight) {
      this.inflight = this.count().finally(() => {
        this.inflight = undefined;
      });
    }
    try {
      const next = await this.inflight;
      this.cached = next;
      this.fetchedAt = this.now();
      return next;
    } catch (err) {
      if (this.cached) return this.cached;
      throw err;
    }
  }

  private async count(): Promise<FoundingSpots> {
    const members = new Set<string>();
    for (let page = 1; page <= 20; page++) {
      const qs = new URLSearchParams({ status: "paid", page: String(page), per_page: "100" });
      const res = await circleRequest<Paged<ChargeLite> | ChargeLite[]>(this.cfg.circle, "GET", `/community_member_charges?${qs}`, undefined, this.fetchImpl);
      const records = Array.isArray(res) ? res : (res.records ?? []);
      for (const c of records) {
        if (c.status && c.status !== "paid") continue;
        if (this.cfg.paywallName && c.paywall_name && c.paywall_name !== this.cfg.paywallName) continue;
        const key = (c.community_member_email ?? "").trim().toLowerCase() || (c.community_member_id ? `id:${c.community_member_id}` : "");
        if (key) members.add(key);
      }
      if (Array.isArray(res) || !res.has_next_page) break;
    }
    return { cap: this.cfg.cap, taken: Math.min(members.size, this.cfg.cap), updatedAt: new Date(this.now()).toISOString() };
  }
}
