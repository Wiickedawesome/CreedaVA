/**
 * SEO Agent config — singleton at integrations/seo-agent.
 *
 * All skills consult this doc. Changes via `/admin/seo` (kill switch, autonomy,
 * recipients) take effect on next skill invocation.
 */

import { db } from "../admin";
import { DEFAULT_AGENT_CONFIG, type SeoAgentConfigDoc } from "./types";

const DOC_PATH = "integrations/seo-agent";

export async function getAgentConfig(): Promise<SeoAgentConfigDoc> {
  try {
    const snap = await db.doc(DOC_PATH).get();
    if (!snap.exists) {
      await db.doc(DOC_PATH).set(
        {
          provider: "seo-agent",
          enabled: DEFAULT_AGENT_CONFIG.enabled,
          config: DEFAULT_AGENT_CONFIG,
          createdAt: new Date(),
        },
        { merge: true },
      );
      return { ...DEFAULT_AGENT_CONFIG };
    }
    const data = snap.data() ?? {};
    const cfg = (data.config ?? data) as Partial<SeoAgentConfigDoc>;
    // Merge with defaults so partial docs keep working as we add fields.
    return {
      ...DEFAULT_AGENT_CONFIG,
      ...cfg,
      autonomy: { ...DEFAULT_AGENT_CONFIG.autonomy, ...(cfg.autonomy ?? {}) },
      summaryRecipients:
        cfg.summaryRecipients?.length
          ? cfg.summaryRecipients
          : DEFAULT_AGENT_CONFIG.summaryRecipients,
    };
  } catch (err) {
    console.warn("[seo-agent] getAgentConfig failed; falling back to defaults:", err);
    return { ...DEFAULT_AGENT_CONFIG };
  }
}

export async function touchLastRun(): Promise<void> {
  try {
    await db.doc(DOC_PATH).set(
      { config: { lastRunAt: new Date().toISOString() } },
      { merge: true },
    );
  } catch {
    /* no-op */
  }
}
