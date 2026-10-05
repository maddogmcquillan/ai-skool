import { describe, expect, it, vi } from "vitest";
import { ChargeLoop, chargeToHook, DEFAULT_PAYWALL_KEYS, parsePaywallKeys, paywallKeyFor, type ChargeLoopConfig, type ChargeRecord } from "../src/chargeLoop.js";
import { purchaseEventId } from "../src/lib/eventId.js";
import { resetAuthScheme } from "../src/circle.js";

const NOW = new Date("2026-09-28T12:00:00Z");

function cfg(overrides: Partial<ChargeLoopConfig> = {}): ChargeLoopConfig {
  return {
    circle: { token: "tok", baseUrl: "https://api.test/v2" },
    capi: { pixelId: "123", accessToken: "meta-tok", apiVersion: "v25.0", defaultSourceUrl: "https://www.joinlearnai.com/checkout/founding-member", currency: "USD" },
    intervalMs: 60_000,
    lookbackMs: 24 * 3_600_000,
    paywallKeys: {},
    dryRun: false,
    ...overrides,
  };
}

const charge = (id: number, email: string, name: string, created: string, amount = 4900, status = "paid"): ChargeRecord => ({
  id, processor_id: `ch_${id}`, status, amount, currency: "usd", created_at: created, paywall_id: 1, paywall_name: "Founding Member", community_member_name: name, community_member_email: email,
});

function fake(state: { charges: ChargeRecord[] }) {
  const sent: Array<Record<string, unknown>> = [];
  const circleCalls: string[] = [];
  const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
    if (url.startsWith("https://graph.facebook.com/")) {
      sent.push(JSON.parse(String(init?.body)));
      return json({ events_received: 1 });
    }
    const u = new URL(url);
    if (u.pathname.endsWith("/community_member_charges")) {
      circleCalls.push(u.search);
      const since = Date.parse(u.searchParams.get("created_at_gte") ?? "0");
      return json({ records: state.charges.filter((c) => c.status === "paid" && Date.parse(c.created_at ?? "") >= since), has_next_page: false });
    }
    return new Response("not found", { status: 404 });
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, sent, circleCalls };
}

describe("ChargeLoop nudge", () => {
  it("runs a tick now and coalesces nudges that arrive during one", async () => {
    resetAuthScheme();
    const state = { charges: [charge(1, "ann@example.com", "Ann Lee", new Date(NOW.getTime() - 60_000).toISOString())] };
    const { fetchImpl, sent, circleCalls } = fake(state);
    const loop = new ChargeLoop(cfg(), { fetchImpl, now: () => NOW, log: () => {} });

    const first = loop.tick();
    loop.nudge();
    loop.nudge();
    await first;
    const until = Date.now() + 2000;
    while (loop.status().ticks < 2 && Date.now() < until) await new Promise((r) => setTimeout(r, 5));
    await new Promise((r) => setTimeout(r, 30));
    expect(loop.status().ticks).toBe(2);
    expect(circleCalls).toHaveLength(2);
    expect(sent).toHaveLength(1); // the charge was sent once, by the first tick

    loop.nudge();
    while (loop.status().ticks < 3 && Date.now() < until) await new Promise((r) => setTimeout(r, 5));
    expect(loop.status().ticks).toBe(3);
    expect(sent).toHaveLength(1);
  });
});

describe("paywall keys", () => {
  it("slugifies the display name unless the map says otherwise", () => {
    expect(paywallKeyFor("Founding Member", {})).toBe("founding-member");
    expect(paywallKeyFor("Founding Member", parsePaywallKeys("Founding Member=founder, Other=other-plan"))).toBe("founder");
    // The paywall was renamed on the checkout page; both names must keep the key the thank-you
    // snippet hardcodes, or Meta would count browser and server Purchase events separately.
    expect(paywallKeyFor("Learn AI Founding Membership", parsePaywallKeys(undefined))).toBe("founding-member");
    expect(paywallKeyFor("Learn AI Founding Membership", parsePaywallKeys("Founding Member=founding-member"))).toBe("founding-member");
    expect(paywallKeyFor("Back in School Access", parsePaywallKeys(undefined))).toBe("founding-member");
    expect(paywallKeyFor("Learn AI Founding Membership", {})).toBe("learn-ai-founding-membership"); // what an empty map would do
    expect(parsePaywallKeys(undefined)).toEqual(DEFAULT_PAYWALL_KEYS);
  });

  it("turns a charge into the webhook shape with dollars, names and the processor id", () => {
    expect(chargeToHook(charge(5, "Parent@Example.com", "Jordan Ruiz", "2026-09-28T10:00:00Z"), {})).toEqual({
      email: "Parent@Example.com", first_name: "Jordan", last_name: "Ruiz", amount: 49, currency: "usd", paywall_key: "founding-member", charge_id: "ch_5", paid_at: "2026-09-28T10:00:00Z",
    });
    expect(chargeToHook({ id: 1, amount: 100 }, {})).toBeNull();
  });
});

describe("ChargeLoop", () => {
  it("sends each paid charge to Meta once with the browser's event_id, and only asks Circle for paid charges", async () => {
    resetAuthScheme();
    const state = { charges: [charge(1, "parent@example.com", "Jordan Ruiz", "2026-09-28T10:00:00Z"), charge(2, "other@example.com", "Sam", "2026-09-28T11:00:00Z", 4900, "refunded")] };
    const { fetchImpl, sent, circleCalls } = fake(state);
    const loop = new ChargeLoop(cfg(), { fetchImpl, now: () => NOW, log: () => {} });

    expect(await loop.tick()).toEqual({ sent: 1, skipped: 0, failed: 0 });
    expect(circleCalls[0]).toContain("status=paid");
    expect(circleCalls[0]).toContain("created_at_gte=2026-09-27T12%3A00%3A00.000Z");
    expect(sent).toHaveLength(1);
    const body = sent[0] as { data: Array<Record<string, unknown>>; access_token: string };
    expect(body.access_token).toBe("meta-tok");
    const ev = body.data[0] as { event_name: string; event_id: string; custom_data: Record<string, unknown> };
    expect(ev.event_name).toBe("Purchase");
    expect(ev.event_id).toBe(purchaseEventId("parent@example.com", "founding-member", new Date("2026-09-28T10:00:00Z")));
    expect(ev.custom_data).toMatchObject({ value: 49, currency: "USD", content_name: "founding-member", order_id: "ch_1" });

    // Same charges again: nothing new goes out.
    expect(await loop.tick()).toEqual({ sent: 0, skipped: 0, failed: 0 });
    expect(sent).toHaveLength(1);

    // A new charge arrives.
    state.charges.push(charge(3, "new@example.com", "Ava Chen", "2026-09-28T11:59:00Z"));
    expect(await loop.tick()).toEqual({ sent: 1, skipped: 0, failed: 0 });
    expect(sent).toHaveLength(2);
    expect(loop.status()).toMatchObject({ enabled: true, ticks: 3, sent: 2, skipped: 0 });
  });

  it("builds but does not send in dry run", async () => {
    resetAuthScheme();
    const { fetchImpl, sent } = fake({ charges: [charge(1, "parent@example.com", "Jordan Ruiz", "2026-09-28T10:00:00Z")] });
    const loop = new ChargeLoop(cfg({ dryRun: true }), { fetchImpl, now: () => NOW, log: () => {} });
    expect(await loop.tick()).toEqual({ sent: 0, skipped: 1, failed: 0 });
    expect(sent).toHaveLength(0);
  });

  it("retries a charge Meta rejected and records the error", async () => {
    resetAuthScheme();
    const state = { charges: [charge(1, "parent@example.com", "Jordan Ruiz", "2026-09-28T10:00:00Z")] };
    let metaOk = false;
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.startsWith("https://graph.facebook.com/")) return new Response(JSON.stringify({ error: { message: "bad token" } }), { status: metaOk ? 200 : 400 });
      return new Response(JSON.stringify({ records: state.charges, has_next_page: false }), { status: 200 });
    }) as unknown as typeof fetch;
    const loop = new ChargeLoop(cfg(), { fetchImpl, now: () => NOW, log: () => {} });
    expect(await loop.tick()).toEqual({ sent: 0, skipped: 0, failed: 1 });
    metaOk = true;
    expect(await loop.tick()).toEqual({ sent: 1, skipped: 0, failed: 0 });
  });
});
