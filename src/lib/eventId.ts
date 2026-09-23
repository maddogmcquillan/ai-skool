import { createHash } from "node:crypto";

/** Lowercase + trim, the same normalization Meta applies before hashing. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** YYYY-MM-DD in UTC. */
export function utcDay(when: Date = new Date()): string {
  return when.toISOString().slice(0, 10);
}

/**
 * Deterministic Meta `event_id` shared by the browser thank-you snippet
 * (circle/paywall-thank-you-tracking.html) and the server-side bridge.
 *
 * Both sides compute: sha256(`${email}|${paywallKey}|${YYYY-MM-DD}`), first 32 hex chars.
 * Meta deduplicates a browser Purchase and a server Purchase that share event_id + event_name,
 * so the same sale is counted once even though it is reported twice.
 *
 * Keep this formula in sync with the browser snippet. The test suite checks parity.
 */
export function purchaseEventId(email: string, paywallKey: string, when: Date = new Date()): string {
  const key = `${normalizeEmail(email)}|${paywallKey.trim().toLowerCase()}|${utcDay(when)}`;
  return sha256Hex(key).slice(0, 32);
}
