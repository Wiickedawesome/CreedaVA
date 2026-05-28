/**
 * SEO Agent — schedule + callable wiring.
 *
 * Daily skill rotation (America/Belize):
 *   Mon 03:00 → onpage-audit (uses some quota for follow-ups), and rank-history at 03:30 (zero CS quota)
 *   Tue 02:00 → keyword-gaps
 *   Wed 02:00 → citation-audit
 *   Thu 02:00 → backlinks-resources
 *   Fri 02:00 → backlinks-competitor
 *   Sat 02:00 → brand-mentions
 *   Sun 02:00 → synthesizer (Gemini-only)
 *
 * Manual trigger: `seoAgentRun` callable, admin-only.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { runSeoAgent } from "./seo-agent";
import type { AgentSkill } from "./seo/types";

const REGION = "us-east4";
const TZ = "America/Belize";
const ALLOWED_ADMIN_DOMAIN = /^[^\s@]+@creedava\.com$/i;

// Gemini API key used by the synthesizer and content-writer skills.
// Must be bound to every function that may invoke them so the secret is
// injected into process.env at runtime. Without this binding,
// process.env.GEMINI_API_KEY is undefined and AI calls silently fall back
// to template output.
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// ─── Daily schedules ─────────────────────────────────

export const seoAgentMon = onSchedule(
  { schedule: "0 3 * * 1", timeZone: TZ, region: REGION, memory: "1GiB", timeoutSeconds: 540, secrets: [GEMINI_API_KEY] },
  async () => {
    await runSeoAgent({ skill: "onpage-audit", source: "scheduled" });
  },
);

export const seoAgentMonRanks = onSchedule(
  { schedule: "30 3 * * 1", timeZone: TZ, region: REGION, secrets: [GEMINI_API_KEY] },
  async () => {
    await runSeoAgent({ skill: "rank-history", source: "scheduled" });
  },
);

export const seoAgentTue = onSchedule(
  { schedule: "0 2 * * 2", timeZone: TZ, region: REGION, memory: "512MiB", timeoutSeconds: 540, secrets: [GEMINI_API_KEY] },
  async () => {
    await runSeoAgent({ skill: "keyword-gaps", source: "scheduled" });
  },
);

export const seoAgentWed = onSchedule(
  { schedule: "0 2 * * 3", timeZone: TZ, region: REGION, memory: "512MiB", timeoutSeconds: 540, secrets: [GEMINI_API_KEY] },
  async () => {
    await runSeoAgent({ skill: "citation-audit", source: "scheduled" });
  },
);

export const seoAgentThu = onSchedule(
  { schedule: "0 2 * * 4", timeZone: TZ, region: REGION, memory: "512MiB", timeoutSeconds: 540, secrets: [GEMINI_API_KEY] },
  async () => {
    await runSeoAgent({ skill: "backlinks-resources", source: "scheduled" });
  },
);

export const seoAgentFri = onSchedule(
  { schedule: "0 2 * * 5", timeZone: TZ, region: REGION, memory: "512MiB", timeoutSeconds: 540, secrets: [GEMINI_API_KEY] },
  async () => {
    await runSeoAgent({ skill: "backlinks-competitor", source: "scheduled" });
  },
);

export const seoAgentSat = onSchedule(
  { schedule: "0 2 * * 6", timeZone: TZ, region: REGION, memory: "512MiB", timeoutSeconds: 540, secrets: [GEMINI_API_KEY] },
  async () => {
    await runSeoAgent({ skill: "brand-mentions", source: "scheduled" });
  },
);

export const seoAgentSun = onSchedule(
  { schedule: "0 2 * * 0", timeZone: TZ, region: REGION, memory: "1GiB", timeoutSeconds: 540, secrets: [GEMINI_API_KEY] },
  async () => {
    await runSeoAgent({ skill: "synthesizer", source: "scheduled" });
  },
);

// ─── Manual "Run now" callable ──────────────────────

const VALID_SKILLS: AgentSkill[] = [
  "onpage-audit",
  "rank-history",
  "keyword-gaps",
  "citation-audit",
  "backlinks-resources",
  "backlinks-competitor",
  "brand-mentions",
  "synthesizer",
];

export const seoAgentRun = onCall({ region: REGION, memory: "1GiB", timeoutSeconds: 540, secrets: [GEMINI_API_KEY] }, async (req) => {
  const email = req.auth?.token?.email;
  if (!email || !ALLOWED_ADMIN_DOMAIN.test(email)) {
    throw new HttpsError("permission-denied", "Admin access required.");
  }
  const skill = req.data?.skill as string | undefined;
  const force = Boolean(req.data?.force);
  if (!skill || !VALID_SKILLS.includes(skill as AgentSkill)) {
    throw new HttpsError("invalid-argument", `skill must be one of: ${VALID_SKILLS.join(", ")}`);
  }
  const outcome = await runSeoAgent({
    skill: skill as AgentSkill,
    source: "manual",
    userId: req.auth?.uid,
    force,
  });
  return outcome;
});
