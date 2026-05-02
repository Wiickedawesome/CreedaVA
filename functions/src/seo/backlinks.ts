/**
 * Backlink prospect skills (Thursday, Friday, Saturday).
 *
 *  Thu → backlinks-resources       — "write for us" / "resources" / "list of"
 *  Fri → backlinks-competitor      — competitor-mention probes
 *  Sat → brand-mentions            — unlinked brand mentions
 *
 * All persist to /backlink-prospects with kind set per skill.
 * Quota: ~60–80 Custom Search queries per skill.
 */

import { db } from "../admin";
import { searchWithQuota, type SearchHit } from "./search";
import type { SkillContext, SkillResult } from "./types";

const OUR_DOMAIN = "creedava.com";
const COMPETITOR_DOMAINS = [
  "belaysolutions.com",
  "timeetc.com",
  "boldly.com",
  "wishup.co",
  "myoutdesk.com",
  "fancyhands.com",
  "zirtual.com",
  "magic.com",
];

const RESOURCE_TOPICS = [
  "virtual assistant services",
  "best virtual assistant",
  "hire virtual assistant",
  "outsourcing virtual assistant",
  "virtual assistant for small business",
  "remote executive assistant",
  "bilingual virtual assistant",
  "virtual assistant Belize",
];

const RESOURCE_PATTERNS = [
  '"write for us"',
  '"contribute"',
  '"guest post"',
  '"resources"',
  '"useful links"',
  '"list of"',
];

// ─── Thursday: resources / guest-post pages ──────────

export async function runBacklinksResources(ctx: SkillContext): Promise<SkillResult> {
  return runProspectSweep(ctx, {
    name: "resources",
    queries: cartesian(RESOURCE_TOPICS, RESOURCE_PATTERNS),
    classify: (hit) => {
      const text = `${hit.title} ${hit.snippet}`.toLowerCase();
      if (/write for us|contribute|guest post/.test(text)) return "guest-post";
      return "resources-page";
    },
  });
}

// ─── Friday: competitor mentions ─────────────────────

export async function runBacklinksCompetitor(ctx: SkillContext): Promise<SkillResult> {
  // For each competitor, search for "{competitor name}" -site:competitor.com
  // → finds blogs / lists / round-ups that mention them; we can pitch ourselves there.
  const queries = COMPETITOR_DOMAINS.flatMap((domain) => {
    const name = domain.split(".")[0].replace(/[-_]/g, " ");
    return [
      `"${name}" virtual assistant -site:${domain}`,
      `"${name}" review -site:${domain}`,
      `"${name}" alternatives -site:${domain}`,
    ];
  });
  return runProspectSweep(ctx, {
    name: "competitor",
    queries,
    classify: () => "competitor-mention",
  });
}

// ─── Saturday: unlinked brand mentions ───────────────

export async function runBrandMentions(ctx: SkillContext): Promise<SkillResult> {
  const queries = [
    `"creedava" -site:${OUR_DOMAIN}`,
    `"creeda va" -site:${OUR_DOMAIN}`,
    `"CreedaVA" virtual assistant -site:${OUR_DOMAIN}`,
    `"creedava.com" -site:${OUR_DOMAIN}`,
  ];
  return runProspectSweep(ctx, {
    name: "brand",
    queries,
    classify: () => "unlinked-brand-mention",
    maxResultsPerQuery: 10,
    /** Brand mentions are high-priority by default. */
    scoreFloor: 65,
  });
}

// ─── Shared sweep engine ─────────────────────────────

interface SweepConfig {
  name: string;
  queries: string[];
  classify: (hit: SearchHit) => "resources-page" | "guest-post" | "competitor-mention" | "unlinked-brand-mention";
  maxResultsPerQuery?: number;
  scoreFloor?: number;
}

async function runProspectSweep(ctx: SkillContext, cfg: SweepConfig): Promise<SkillResult> {
  const startOffset = ctx.cursor?.offset ?? 0;
  let lastIndex = startOffset;
  let written = 0;
  let probed = 0;

  for (let i = startOffset; i < cfg.queries.length; i++) {
    if (!ctx.hasQuota()) break;
    const q = cfg.queries[i];
    const hits = await searchWithQuota(ctx, q, cfg.maxResultsPerQuery ?? 10);
    lastIndex = i + 1;
    if (hits === null) {
      lastIndex = i; // resume on this query next time
      break;
    }
    probed++;

    for (const hit of hits) {
      const domain = (hit.displayLink || safeDomain(hit.link)).toLowerCase();
      if (domain.includes(OUR_DOMAIN)) continue;            // skip ourselves
      if (COMPETITOR_DOMAINS.some((c) => domain.includes(c)) && cfg.name !== "competitor") {
        // Don't list competitors as backlink targets except in competitor sweep.
        continue;
      }
      const kind = cfg.classify(hit);
      const id = `${kind}__${slug(domain)}__${slug(hit.link).slice(0, 50)}`.slice(0, 380);
      const score = scoreProspect(hit, domain, cfg.scoreFloor ?? 0);
      try {
        await db.collection("backlink-prospects").doc(id).set(
          {
            kind,
            domain,
            url: hit.link,
            title: hit.title,
            snippet: hit.snippet,
            sourceQuery: q,
            score,
            status: "new",
            capturedAt: new Date().toISOString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { merge: true },
        );
        written++;
      } catch (err) {
        console.warn("[backlinks] persist failed:", err);
      }
    }
  }

  const reachedEnd = lastIndex >= cfg.queries.length;
  return {
    status: reachedEnd ? "ok" : "partial",
    findings: written,
    queriesUsed: ctx.queriesUsed(),
    cursor: reachedEnd ? null : { offset: lastIndex },
    summary: { sweep: cfg.name, queriesProbed: probed, persisted: written, totalQueries: cfg.queries.length },
  };
}

// ─── Helpers ─────────────────────────────────────────

function cartesian<A, B>(a: A[], b: B[]): string[] {
  const out: string[] = [];
  for (const x of a) for (const y of b) out.push(`${y} ${x}`);
  return out;
}

function scoreProspect(hit: SearchHit, domain: string, floor: number): number {
  let score = floor;
  // Prefer HTTPS
  if (hit.link.startsWith("https://")) score += 10;
  // Penalize very deep URLs (5+ slashes after domain)
  const depth = (hit.link.split("/").length - 3);
  score += Math.max(-15, 10 - depth * 3);
  // Bonus for relevant terms
  const text = `${hit.title} ${hit.snippet}`.toLowerCase();
  if (/virtual assistant|outsourc|remote work|productivity/.test(text)) score += 15;
  if (/best |top |list|guide|review/.test(text)) score += 5;
  // Penalize obvious low-quality TLDs
  if (/\.(xyz|top|click|loan)$/.test(domain)) score -= 30;
  return Math.max(0, Math.min(100, score + 30)); // base offset
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
