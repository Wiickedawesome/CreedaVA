"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminTabs } from "@/components/admin";
import { SeoAgentDashboard } from "../agent-dashboard";
import WeeklyDigestSection from "./weekly-digest-section";
import { AuditsSection } from "./audits-section";

const SUB_TABS = [
  { label: "Agent runs", value: "runs" },
  { label: "Audits", value: "audits" },
  { label: "Weekly digest", value: "digest" },
];

const VALID_TABS = new Set(SUB_TABS.map((t) => t.value));

export default function AgentHubSection() {
  // `?tab=` makes a sub-tab linkable — the retired /admin/seo/audits route
  // redirects straight to the audit list instead of the run history.
  const searchParams = useSearchParams();
  const requested = searchParams?.get("tab") ?? "";
  const [tab, setTab] = useState(VALID_TABS.has(requested) ? requested : "runs");

  return (
    <div className="space-y-6">
      <AdminTabs tabs={SUB_TABS} activeTab={tab} onChange={setTab} />
      {tab === "runs" && <SeoAgentDashboard />}
      {tab === "audits" && <AuditsSection />}
      {tab === "digest" && <WeeklyDigestSection />}
    </div>
  );
}
