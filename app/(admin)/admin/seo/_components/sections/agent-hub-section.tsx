"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminTabs } from "@/components/admin";
import { SeoAgentDashboard } from "../agent-dashboard";
import WeeklyDigestSection from "./weekly-digest-section";
import BriefsSection from "./briefs-section";

/**
 * What the agent did, what it wrote, and the weekly summary.
 *
 * Findings are deliberately absent: an on-page issue is a fact about a path and
 * a keyword issue is a fact about a query, so each is listed on the page that
 * owns that thing. Listing them again here only made it harder to tell where a
 * finding came from.
 */
const SUB_TABS = [
  { label: "Agent runs", value: "runs" },
  { label: "Briefs", value: "briefs" },
  { label: "Weekly digest", value: "digest" },
];

const VALID_TABS = new Set(SUB_TABS.map((t) => t.value));

export default function AgentHubSection() {
  // `?tab=` makes a sub-tab linkable — the retired /admin/seo/briefs and
  // /admin/seo/digest routes redirect here instead of to run history.
  const searchParams = useSearchParams();
  const requested = searchParams?.get("tab") ?? "";
  const [tab, setTab] = useState(VALID_TABS.has(requested) ? requested : "runs");

  return (
    <div className="space-y-6">
      <AdminTabs tabs={SUB_TABS} activeTab={tab} onChange={setTab} />
      {tab === "runs" && <SeoAgentDashboard />}
      {tab === "briefs" && <BriefsSection />}
      {tab === "digest" && <WeeklyDigestSection />}
    </div>
  );
}
