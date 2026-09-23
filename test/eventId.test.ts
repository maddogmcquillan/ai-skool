import { describe, expect, it } from "vitest";
import { purchaseEventId, sha256Hex } from "../src/lib/eventId.js";

/** Re-implementation of the browser snippet's algorithm using WebCrypto, to prove parity. */
async function browserEventId(email: string, paywallKey: string, when: Date): Promise<string> {
  const norm = (s: string) => String(s || "").trim().toLowerCase();
  const day = when.toISOString().slice(0, 10);
  const bytes = new TextEncoder().encode(norm(email) + "|" + norm(paywallKey) + "|" + day);
  const buf = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.prototype.map.call(new Uint8Array(buf), (b: number) => ("0" + b.toString(16)).slice(-2)).join("");
  return hex.slice(0, 32);
}

describe("purchaseEventId", () => {
  const when = new Date("2026-09-23T15:04:05Z");

  it("is deterministic and 32 hex chars", () => {
    const a = purchaseEventId("kid@example.com", "founding-member", when);
    const b = purchaseEventId("kid@example.com", "founding-member", when);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{32}$/);
  });

  it("normalizes email case and whitespace and paywall key case", () => {
    const a = purchaseEventId("  Kid@Example.COM ", "Founding-Member", when);
    const b = purchaseEventId("kid@example.com", "founding-member", when);
    expect(a).toBe(b);
  });

  it("changes when the UTC day changes", () => {
    const a = purchaseEventId("kid@example.com", "founding-member", when);
    const b = purchaseEventId("kid@example.com", "founding-member", new Date("2026-09-24T00:00:01Z"));
    expect(a).not.toBe(b);
  });

  it("matches the browser snippet's WebCrypto implementation", async () => {
    const server = purchaseEventId("Parent@Example.com", "founding-member", when);
    const browser = await browserEventId("Parent@Example.com", "founding-member", when);
    expect(browser).toBe(server);
  });

  it("sha256Hex matches a known vector", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
