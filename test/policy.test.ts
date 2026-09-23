import { describe, expect, it } from "vitest";
import { escalationReply, evaluateQuestion, isBotAuthor } from "../src/bot/policy.js";

describe("evaluateQuestion", () => {
  it("lets normal course questions through", () => {
    expect(evaluateQuestion("How do I make my chatbot remember my name?")).toEqual({ escalate: false });
    expect(evaluateQuestion("What is the difference between AI and machine learning?")).toEqual({ escalate: false });
  });

  it("escalates billing, account, safety and personal-info questions", () => {
    expect(evaluateQuestion("Can I get a refund for this month?").reason).toBe("billing");
    expect(evaluateQuestion("I forgot my password").reason).toBe("account");
    expect(evaluateQuestion("someone is bullying me in the comments").reason).toBe("safety");
    expect(evaluateQuestion("what's your phone number?").reason).toBe("personal-info");
  });

  it("writes a safety reply that points to a trusted adult", () => {
    expect(escalationReply("Ava", "safety")).toContain("trusted adult");
    expect(escalationReply(undefined, "billing")).toContain("real person");
  });
});

describe("isBotAuthor", () => {
  it("matches case-insensitively and handles missing values", () => {
    expect(isBotAuthor("Coach@Example.com", "coach@example.com")).toBe(true);
    expect(isBotAuthor("kid@example.com", "coach@example.com")).toBe(false);
    expect(isBotAuthor(undefined, "coach@example.com")).toBe(false);
  });
});
