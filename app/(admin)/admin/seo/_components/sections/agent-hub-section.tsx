"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminTabs } from "@/components/admin";
import { SeoAgentDashboard } from "../agent-dashboard";
import WeeklyDigestSection from "./weekly-digest-section";
import { FindingsSection } from "./findings-section";
import BriefsSection from "./briefs-section";
import { SeoTasksBoard } from "../tasks-board";

/**
 * Everything the agent produces lives here, next to the runs that produce it.
 *
 * Ordering is deliberate — run history first (what happened), then the outputs
 * it writes (audits → briefs → action items), then the weekly summary.
 */
const SUB_TABS = [
  { label: "Agent runs", value: "runs" },
  { label: "Findings", value: "audits" },
  { label: "Briefs", value: "briefs" },
  { label: "Action items", value: "action-items" },
  { label: "Weekly digest", value: "digest" },
];

const VALID_TABS = new Set(SUB_TABS.map((t) => t.value));

export default function AgentHubSection() {
  // `?tab=` makes a sub-tab linkable — the retired /admin/seo/audits, /briefs
  // and /tasks routes redirect to their list instead of run history.
  const searchParams = useSearchParams();
  const requested = searchParams?.get("tab") ?? "";
  const [tab, setTab] = useState(VALID_TABS.has(requested) ? requested : "runs");

  return (
    <div className="space-y-6">
      <AdminTabs tabs={SUB_TABS} activeTab={tab} onChange={setTab} />
      {tab === "runs" && <SeoAgentDashboard />}
      {tab === "audits" && <FindingsSection />}
      {tab === "briefs" && <BriefsSection />}
      {tab === "action-items" && <SeoTasksBoard />}
      {tab === "digest" && <WeeklyDigestSection />}
    </div>
  );
}
