"use client";

import React, { useState } from "react";
import { AdminTabs } from "@/components/admin";
import OpportunitiesSection from "./opportunities-section";
import CitationsSection from "./citations-section";

const SUB_TABS = [
  { label: "Opportunities", value: "opportunities" },
  { label: "Citations", value: "citations" },
];

export default function OpportunitiesHubSection() {
  const [tab, setTab] = useState("opportunities");

  return (
    <div className="space-y-6">
      <AdminTabs tabs={SUB_TABS} activeTab={tab} onChange={setTab} />
      {tab === "opportunities" ? <OpportunitiesSection /> : <CitationsSection />}
    </div>
  );
}
