import { circleRequest, createCircleComment, type CircleClientConfig } from "../circle.js";
import type { KnowledgeBase } from "./knowledge.js";
import { isBotAuthor } from "./policy.js";
import { composeReply, type ReplyOptions } from "./respond.js";

/**
 * Coach without Zapier: every `intervalMs` the loop lists the newest published posts in the
 * Ask Coach space through the Admin API, skips the ones Coach (or the team) already handled,
 * and posts a reply as a comment. The reply is authored by whoever created the API token, so
 * the token must be created while signed in as the Coach account.
 *
 * State is in memory. After a restart the loop re-reads the comments on each recent post, so a
 * post that already has a Coach comment is never answered twice.
 */
export interface CoachLoopConfig {
  circle: CircleClientConfig;
  /** Slug of the space to watch, e.g. "ask-coach". */
  spaceSlug: string;
  /** Email of the Coach member; its own posts and comments are ignored. */
  botAuthorEmail?: string;
  /** Other authors to leave alone: the team account, the owner. */
  ignoreAuthorEmails?: string[];
  intervalMs: number;
  /** Posts older than this are left alone (a fresh deploy must not answer ancient threads). */
  lookbackDays: number;
  reply: ReplyOptions;
}

export interface CoachLoopDeps {
  kb: () => KnowledgeBase;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  log?: (message: string) => void;
  compose?: typeof composeReply;
}

export interface CoachLoopStatus {
  enabled: true;
  spaceSlug: string;
  spaceId?: number;
  ticks: number;
  answered: number;
  escalated: number;
  skipped: number;
  lastTickAt?: string;
  lastError?: string;
}

interface Paged<T> {
  records?: T[];
  has_next_page?: boolean;
}
interface SpaceRecord {
  id: number;
  slug: string;
  name: string;
}
export interface PostRecord {
  id: number;
  name?: string;
  body?: { body?: string | null } | null;
  user_email?: string;
  user_name?: string;
  space_name?: string;
  url?: string;
  created_at?: string;
  published_at?: string;
  is_comments_enabled?: boolean;
  is_comments_closed?: boolean;
}
interface CommentRecord {
  id: number;
  user?: { email?: string; name?: string };
  author_type?: string;
}

const MAX_FAILURES_PER_POST = 3;

export class CoachLoop {
  private handled = new Set<number>();
  private failures = new Map<number, number>();
  private spaceId?: number;
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;
  private stats = { ticks: 0, answered: 0, escalated: 0, skipped: 0 };
  private lastTickAt?: string;
  private lastError?: string;
  private readonly ignore: Set<string>;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => Date;
  private readonly log: (message: string) => void;
  private readonly compose: typeof composeReply;

  constructor(
    private readonly cfg: CoachLoopConfig,
    private readonly deps: CoachLoopDeps,
  ) {
    this.ignore = new Set((cfg.ignoreAuthorEmails ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean));
    this.fetchImpl = deps.fetchImpl ?? fetch;
    this.now = deps.now ?? (() => new Date());
    this.log = deps.log ?? ((m) => console.log(`[coach] ${m}`));
    this.compose = deps.compose ?? composeReply;
  }

  status(): CoachLoopStatus {
    return { enabled: true, spaceSlug: this.cfg.spaceSlug, spaceId: this.spaceId, ...this.stats, lastTickAt: this.lastTickAt, lastError: this.lastError };
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

  /** One pass over the newest posts. Exposed so tests and operators can drive it by hand. */
  async tick(): Promise<{ answered: number; skipped: number; failed: number }> {
    const result = { answered: 0, skipped: 0, failed: 0 };
    if (this.busy) return result;
    this.busy = true;
    try {
      this.stats.ticks++;
      this.lastTickAt = this.now().toISOString();
      const spaceId = await this.resolveSpace();
      const posts = await this.listPosts(spaceId);
      for (const post of posts) {
        const outcome = await this.handlePost(post);
        if (outcome) result[outcome]++;
      }
      this.lastError = undefined;
    } catch (err) {
      this.lastError = (err as Error).message;
      this.log(`tick failed: ${this.lastError}`);
    } finally {
      this.busy = false;
    }
    return result;
  }

  private async resolveSpace(): Promise<number> {
    if (this.spaceId) return this.spaceId;
    for (let page = 1; page < 20; page++) {
      const res = await circleRequest<Paged<SpaceRecord> | SpaceRecord[]>(this.cfg.circle, "GET", `/spaces?page=${page}&per_page=100`, undefined, this.fetchImpl);
      const records = Array.isArray(res) ? res : (res.records ?? []);
      const hit = records.find((s) => s.slug === this.cfg.spaceSlug);
      if (hit) {
        this.spaceId = hit.id;
        this.log(`watching "${hit.name}" (space ${hit.id})`);
        return hit.id;
      }
      if (Array.isArray(res) || !res.has_next_page) break;
    }
    throw new Error(`no space with slug "${this.cfg.spaceSlug}"`);
  }

  private async listPosts(spaceId: number): Promise<PostRecord[]> {
    const res = await circleRequest<Paged<PostRecord> | PostRecord[]>(
      this.cfg.circle,
      "GET",
      `/posts?space_id=${spaceId}&status=published&sort=latest&per_page=20`,
      undefined,
      this.fetchImpl,
    );
    return Array.isArray(res) ? res : (res.records ?? []);
  }

  private async handlePost(post: PostRecord): Promise<"answered" | "skipped" | "failed" | null> {
    if (this.handled.has(post.id)) return null;
    if ((this.failures.get(post.id) ?? 0) >= MAX_FAILURES_PER_POST) return null;

    const author = (post.user_email ?? "").trim().toLowerCase();
    const skip = (why: string) => {
      this.handled.add(post.id);
      this.stats.skipped++;
      this.log(`skip post ${post.id}: ${why}`);
      return "skipped" as const;
    };

    if (isBotAuthor(author, this.cfg.botAuthorEmail)) return skip("written by Coach");
    if (author && this.ignore.has(author)) return skip(`written by ${author}`);
    if (post.is_comments_enabled === false || post.is_comments_closed) return skip("comments are closed");
    const stamp = post.published_at ?? post.created_at;
    if (stamp) {
      const ageMs = this.now().getTime() - new Date(stamp).getTime();
      if (ageMs > this.cfg.lookbackDays * 86_400_000) return skip("older than the lookback window");
    }

    const comments = await circleRequest<Paged<CommentRecord> | CommentRecord[]>(
      this.cfg.circle,
      "GET",
      `/comments?post_id=${post.id}&per_page=100`,
      undefined,
      this.fetchImpl,
    );
    const records = Array.isArray(comments) ? comments : (comments.records ?? []);
    if (records.some((c) => isBotAuthor(c.user?.email, this.cfg.botAuthorEmail) || c.author_type === "CommunityAiAgent")) {
      return skip("Coach already replied");
    }

    try {
      const reply = await this.compose(
        { title: post.name, bodyHtml: post.body?.body ?? undefined, authorName: post.user_name, spaceName: post.space_name },
        this.deps.kb(),
        this.cfg.reply,
      );
      if (this.cfg.reply.dryRun) {
        this.handled.add(post.id);
        this.stats.skipped++;
        this.log(`dry run, not posting on post ${post.id}: ${reply.answer.slice(0, 120)}`);
        return "skipped";
      }
      await createCircleComment(this.cfg.circle, { postId: post.id, body: reply.answer }, this.fetchImpl);
      this.handled.add(post.id);
      this.stats.answered++;
      if (reply.escalate) this.stats.escalated++;
      this.log(`replied on post ${post.id} "${post.name ?? ""}"${reply.escalate ? ` (escalated: ${reply.reason})` : ""}`);
      return "answered";
    } catch (err) {
      const n = (this.failures.get(post.id) ?? 0) + 1;
      this.failures.set(post.id, n);
      this.log(`post ${post.id} failed (${n}/${MAX_FAILURES_PER_POST}): ${(err as Error).message}`);
      return "failed";
    }
  }
}
