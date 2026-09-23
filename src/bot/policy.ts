/**
 * Questions the bot must not answer on its own. These go to a human.
 * Keep this list conservative: it is cheaper to escalate a harmless question
 * than to have a bot handle a billing dispute or a safety concern with a minor.
 */
const ESCALATION_RULES: Array<{ reason: string; pattern: RegExp }> = [
  { reason: "billing", pattern: /\b(refund|refunds|cancel(?:l?ed|l?ing|lation)?|charged|charge me|billing|invoice|receipt|payment failed|card declined|price|pricing|discount|coupon)\b/i },
  { reason: "account", pattern: /\b(password|log ?in|login|sign ?in|locked out|delete my account|change my email|2fa)\b/i },
  { reason: "safety", pattern: /\b(suicide|self[- ]?harm|hurt myself|kill myself|abuse|abused|bully|bullying|threat|threaten|stalk|groom|grooming)\b/i },
  { reason: "personal-info", pattern: /\b(phone number|home address|where do you live|what school|meet up|meet in person|send (me )?a (pic|picture|photo)|snapchat|whatsapp)\b/i },
  { reason: "legal", pattern: /\b(lawsuit|lawyer|legal action|coppa|gdpr|data request|privacy request)\b/i },
];

export interface PolicyDecision {
  escalate: boolean;
  reason?: string;
}

export function evaluateQuestion(text: string): PolicyDecision {
  for (const rule of ESCALATION_RULES) {
    if (rule.pattern.test(text)) return { escalate: true, reason: rule.reason };
  }
  return { escalate: false };
}

export function escalationReply(firstName: string | undefined, reason: string): string {
  const name = firstName ? `Hi ${firstName}! ` : "Hi! ";
  const detail =
    reason === "safety"
      ? "This sounds important, so I have flagged it for a real person on our team. If you are in danger right now, please tell a trusted adult or call your local emergency number."
      : "This is one for a real person on our team rather than me. I have flagged it and someone will reply here soon.";
  return `${name}Thanks for posting. ${detail}`;
}

export function isBotAuthor(authorEmail: string | undefined, botEmail: string | undefined): boolean {
  if (!authorEmail || !botEmail) return false;
  return authorEmail.trim().toLowerCase() === botEmail.trim().toLowerCase();
}
