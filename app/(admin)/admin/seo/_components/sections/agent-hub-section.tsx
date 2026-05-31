"use client";

import React, { useState } from "react";
import { AdminTabs } from "@/components/admin";
import { SeoAgentDashboard } from "../agent-dashboard";
import WeeklyDigestSection from "./weekly-digest-section";

const SUB_TABS = [
  { label: "Agent runs", value: "runs" },
  { label: "Weekly digest", value: "digest" },
];

export default function AgentHubSection() {
  const [tab, setTab] = useState("runs");

  return (
    <div className="space-y-6">
      <AdminTabs tabs={SUB_TABS} activeTab={tab} onChange={setTab} />
      {tab === "runs" ? <SeoAgentDashboard /> : <WeeklyDigestSection />}
    </div>
  );
}
