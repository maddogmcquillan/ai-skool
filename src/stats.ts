/**
 * First-party funnel counters for the landing pages: page views, scroll depth, which button was
 * tapped, and hand-offs to checkout. The pages send `POST /api/track` beacons; `GET /api/stats`
 * returns aggregate counts (no personal data). Counters live in memory, so they restart on every
 * deploy; every hit is also logged to stdout so Railway's log search can rebuild a day.
 */
export const TRACK_EVENTS = [
  "view",
  "scroll_25",
  "scroll_50",
  "scroll_75",
  "scroll_100",
  "cta_hero",
  "cta_sticky",
  "cta_offer_checkout",
  "syllabus_open",
  "spots_shown",
] as const;
export type TrackEvent = (typeof TRACK_EVENTS)[number];

const EVENT_SET = new Set<string>(TRACK_EVENTS);
const PAGE_RE = /^[a-z0-9-]{1,40}$/;
const MAX_PAGES = 50;
const MAX_DAYS = 60;

export interface StatsSnapshot {
  since: string;
  updatedAt: string;
  totals: Record<string, Record<string, number>>;
  byDay: Record<string, Record<string, Record<string, number>>>;
}

export class StatsCounter {
  private readonly since: string;
  private readonly totals = new Map<string, Map<string, number>>();
  private readonly byDay = new Map<string, Map<string, Map<string, number>>>();
  private updatedAt: string;

  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly log: (line: string) => void = (m) => console.log(m),
  ) {
    this.since = this.now().toISOString();
    this.updatedAt = this.since;
  }

  /** Returns false when the beacon is not one of the known events or pages. */
  record(event: unknown, page: unknown): boolean {
    if (typeof event !== "string" || !EVENT_SET.has(event)) return false;
    if (typeof page !== "string" || !PAGE_RE.test(page)) return false;
    if (!this.totals.has(page) && this.totals.size >= MAX_PAGES) return false;
    const at = this.now();
    const day = at.toISOString().slice(0, 10);
    bump(this.totals, page, event);
    let dayMap = this.byDay.get(day);
    if (!dayMap) {
      dayMap = new Map();
      this.byDay.set(day, dayMap);
      if (this.byDay.size > MAX_DAYS) this.byDay.delete([...this.byDay.keys()].sort()[0]);
    }
    bump(dayMap, page, event);
    this.updatedAt = at.toISOString();
    this.log(`[track] ${day} ${page} ${event}`);
    return true;
  }

  snapshot(): StatsSnapshot {
    const totals: StatsSnapshot["totals"] = {};
    for (const [page, m] of this.totals) totals[page] = Object.fromEntries(m);
    const byDay: StatsSnapshot["byDay"] = {};
    for (const day of [...this.byDay.keys()].sort()) {
      byDay[day] = {};
      for (const [page, m] of this.byDay.get(day)!) byDay[day][page] = Object.fromEntries(m);
    }
    return { since: this.since, updatedAt: this.updatedAt, totals, byDay };
  }
}

function bump(map: Map<string, Map<string, number>>, page: string, event: string): void {
  let m = map.get(page);
  if (!m) {
    m = new Map();
    map.set(page, m);
  }
  m.set(event, (m.get(event) ?? 0) + 1);
}
