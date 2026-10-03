import { circleRequest, createCircleComment, type CircleClientConfig } from "../circle.js";
import type { KnowledgeBase } from "./knowledge.js";
import { isBotAuthor, isEscalationReply } from "./policy.js";
import { composeReply, type ReplyOptions, type ThreadMessage } from "./respond.js";

/**
 * Coach without Zapier. Every `intervalMs` the loop lists the newest published posts in the
 * Ask Coach space through the Admin API and, for each thread where the last word belongs to a
 * member, posts Coach's reply as a comment. That covers the first question on a new post and
 * every follow-up comment after it, so a thread reads as a conversation.
 *
 * Rules of the road:
 * - Coach stays quiet when the last message is Coach's own, or a team member's (a human took
 *   over), or after Coach has handed the thread to a human (the escalation reply).
 * - A post older than the lookback window is not answered retroactively; the loop records how
 *   many comments it has and only reacts when that number grows.
 * - Comments are fetched only when a post's comment count changed, so a quiet community costs
 *   one request per poll. Every poll is a billed Admin API call, so the interval is minutes, not
 *   seconds, and a Circle workflow webhook on POST /hooks/circle/nudge wakes the loop early.
 * - State is in memory. After a restart the thread itself says whether Coach owes a reply, so
 *   nothing is answered twice.
 *
 * The reply is authored by whoever created the API token, so create the token as Coach.
 */
export interface CoachLoopConfig {
  circle: CircleClientConfig;
  /** Slug of the space to watch, e.g. "ask-coach". */
  spaceSlug: string;
  /** Email of the Coach member; its own posts and comments are recognised by it. */
  botAuthorEmail?: string;
  /** Team authors: their posts are not questions and their comments mean a human is handling it. */
  ignoreAuthorEmails?: string[];
  intervalMs: number;
  /** Posts older than this are baselined instead of answered on first sight. */
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
  comments_count?: number;
  is_comments_enabled?: boolean;
  is_comments_closed?: boolean;
}
export interface CommentRecord {
  id: number;
  parent_comment_id?: number | null;
  created_at?: string;
  body?: { body?: string | null } | null;
  user?: { email?: string; name?: string };
  author_type?: string;
  replies?: CommentRecord[];
}

type Role = "member" | "coach" | "team";
type Outcome = "answered" | "skipped" | "failed";

const MAX_FAILURES = 3;

export class CoachLoop {
  /** Per post: the comment count we last acted on, so unchanged threads cost no requests. */
  private seen = new Map<number, number>();
  /** Per post: the member message (post id or comment id) Coach last replied to. */
  private repliedTo = new Map<number, number>();
  private failures = new Map<string, number>();
  private spaceId?: number;
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;
  private again = false;
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

  /**
   * Run a tick now because a webhook said something changed in the space. A tick already in
   * flight is followed by exactly one more, so a comment posted during it is not missed and a
   * burst of webhooks costs at most two passes.
   */
  nudge(): void {
    if (this.busy) {
      this.again = true;
      return;
    }
    void this.tick();
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
      for (const post of await this.listPosts(spaceId)) {
        const outcome = await this.handlePost(post);
        if (outcome) result[outcome]++;
      }
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

  private roleOf(email: string | undefined, authorType?: string): Role {
    if (authorType === "CommunityAiAgent" || isBotAuthor(email, this.cfg.botAuthorEmail)) return "coach";
    if (email && this.ignore.has(email.trim().toLowerCase())) return "team";
    return "member";
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

  /** All comments on a post, replies included, oldest first. */
  private async listComments(postId: number): Promise<CommentRecord[]> {
    const byId = new Map<number, CommentRecord>();
    const add = (c: CommentRecord) => {
      if (!byId.has(c.id)) byId.set(c.id, c);
      for (const r of c.replies ?? []) add(r);
    };
    for (let page = 1; page <= 3; page++) {
      const res = await circleRequest<Paged<CommentRecord> | CommentRecord[]>(
        this.cfg.circle,
        "GET",
        `/comments?post_id=${postId}&page=${page}&per_page=100`,
        undefined,
        this.fetchImpl,
      );
      const records = Array.isArray(res) ? res : (res.records ?? []);
      records.forEach(add);
      if (Array.isArray(res) || !res.has_next_page) break;
    }
    return [...byId.values()].sort((a, b) => Date.parse(a.created_at ?? "") - Date.parse(b.created_at ?? "") || a.id - b.id);
  }

  private async handlePost(post: PostRecord): Promise<Outcome | null> {
    const count = post.comments_count ?? 0;
    const firstSight = !this.seen.has(post.id);
    if (!firstSight && this.seen.get(post.id) === count) return null;

    const skip = (why: string, remember = true): Outcome => {
      if (remember) this.seen.set(post.id, count);
      this.stats.skipped++;
      this.log(`skip post ${post.id}: ${why}`);
      return "skipped";
    };

    if (post.is_comments_enabled === false || post.is_comments_closed) return skip("comments are closed");
    if (firstSight) {
      const stamp = post.published_at ?? post.created_at;
      const ageMs = stamp ? this.now().getTime() - new Date(stamp).getTime() : 0;
      if (ageMs > this.cfg.lookbackDays * 86_400_000) return skip("older than the lookback window; watching for new comments only");
    }

    const postRole = this.roleOf(post.user_email);
    const comments = await this.listComments(post.id);
    if (!comments.length && postRole !== "member") return skip(`post written by ${postRole}`);
    if (comments.some((c) => this.roleOf(c.user?.email, c.author_type) === "coach" && isEscalationReply(c.body?.body ?? undefined))) {
      return skip("handed to a human earlier in this thread");
    }

    const last = comments[comments.length - 1];
    if (last && this.roleOf(last.user?.email, last.author_type) !== "member") {
      return skip(last ? `last message is from ${this.roleOf(last.user?.email, last.author_type)}` : "nothing to answer");
    }

    const latestId = last ? last.id : post.id;
    if (this.repliedTo.get(post.id) === latestId) return skip("already replied to this message", false);
    const failKey = `${post.id}:${latestId}`;
    if ((this.failures.get(failKey) ?? 0) >= MAX_FAILURES) return null;

    const thread: ThreadMessage[] = [
      { role: postRole, name: post.user_name, text: post.body?.body ?? "" },
      ...comments.slice(0, -1).map((c) => ({ role: this.roleOf(c.user?.email, c.author_type), name: c.user?.name, text: c.body?.body ?? "" })),
    ];
    const latest = last
      ? { title: post.name, bodyHtml: last.body?.body ?? "", authorName: last.user?.name, spaceName: post.space_name, thread }
      : { title: post.name, bodyHtml: post.body?.body ?? "", authorName: post.user_name, spaceName: post.space_name };

    try {
      const reply = await this.compose(latest, this.deps.kb(), this.cfg.reply);
      if (this.cfg.reply.dryRun) {
        this.repliedTo.set(post.id, latestId);
        return skip(`dry run, would reply: ${reply.answer.slice(0, 120)}`);
      }
      await createCircleComment(
        this.cfg.circle,
        { postId: post.id, body: reply.answer, parentCommentId: last ? (last.parent_comment_id ?? last.id) : undefined },
        this.fetchImpl,
      );
      this.repliedTo.set(post.id, latestId);
      this.seen.set(post.id, count + 1);
      this.stats.answered++;
      if (reply.escalate) this.stats.escalated++;
      this.log(`replied on post ${post.id} "${post.name ?? ""}"${last ? ` (follow-up to comment ${last.id})` : ""}${reply.escalate ? ` (escalated: ${reply.reason})` : ""}`);
      return "answered";
    } catch (err) {
      const n = (this.failures.get(failKey) ?? 0) + 1;
      this.failures.set(failKey, n);
      this.log(`post ${post.id} failed (${n}/${MAX_FAILURES}): ${(err as Error).message}`);
      return "failed";
    }
  }
}
