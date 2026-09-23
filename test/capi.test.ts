import { describe, expect, it, vi } from "vitest";
import { buildMetaEvent, metaEventsUrl, parseAmount, sendToMeta } from "../src/capi.js";
import { purchaseEventId, sha256Hex } from "../src/lib/eventId.js";

const cfg = { defaultSourceUrl: "https://learn.example.com/checkout/founding-member", currency: "USD" };

describe("buildMetaEvent", () => {
  it("builds a hashed Purchase event with a deterministic event_id", () => {
    const paidAt = "2026-09-23T15:04:05Z";
    const ev = buildMetaEvent(
      { email: " Parent@Example.com ", first_name: "Sam", last_name: "Lee", amount: "50.00", paywall_key: "founding-member", charge_id: "ch_1", paid_at: paidAt, fbp: "fb.1.123.456" },
      cfg,
    );
    expect(ev.event_name).toBe("Purchase");
    expect(ev.action_source).toBe("website");
    expect(ev.event_time).toBe(Math.floor(new Date(paidAt).getTime() / 1000));
    expect(ev.event_id).toBe(purchaseEventId("parent@example.com", "founding-member", new Date(paidAt)));
    expect(ev.user_data.em).toEqual([sha256Hex("parent@example.com")]);
    expect(ev.user_data.fn).toEqual([sha256Hex("sam")]);
    expect(ev.user_data.ln).toEqual([sha256Hex("lee")]);
    expect(ev.user_data.fbp).toBe("fb.1.123.456");
    expect(ev.custom_data.value).toBe(50);
    expect(ev.custom_data.currency).toBe("USD");
    expect(ev.custom_data.order_id).toBe("ch_1");
    expect(ev.event_source_url).toBe(cfg.defaultSourceUrl);
    expect(JSON.stringify(ev)).not.toContain("parent@example.com");
  });

  it("sends StartTrial when nothing was paid", () => {
    const ev = buildMetaEvent({ email: "a@b.co", amount: 0, paywall_key: "founding-member" }, cfg);
    expect(ev.event_name).toBe("StartTrial");
    expect(ev.custom_data.value).toBe(0);
  });

  it("parses messy amounts", () => {
    expect(parseAmount("$50.00")).toBe(50);
    expect(parseAmount("49,99")).toBe(4999);
    expect(parseAmount(undefined)).toBe(0);
    expect(parseAmount(12.5)).toBe(12.5);
  });
});

describe("sendToMeta", () => {
  it("posts to the versioned events endpoint with the access token and test code", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ events_received: 1 }), { status: 200 }));
    const ev = buildMetaEvent({ email: "a@b.co", amount: 50, paywall_key: "founding-member" }, cfg);
    const res = await sendToMeta([ev], { ...cfg, pixelId: "123", accessToken: "tok", apiVersion: "v25.0", testEventCode: "TEST1" }, fetchImpl as unknown as typeof fetch);
    expect(res.ok).toBe(true);
    expect(res.body).toEqual({ events_received: 1 });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(metaEventsUrl({ apiVersion: "v25.0", pixelId: "123" }));
    const body = JSON.parse(String(init.body));
    expect(body.access_token).toBe("tok");
    expect(body.test_event_code).toBe("TEST1");
    expect(body.data[0].event_id).toBe(ev.event_id);
  });
});
