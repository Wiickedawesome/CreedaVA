"use client";

import SatisfactionSurvey from "@/components/survey/satisfaction-survey";

/**
 * Demo / preview version of the satisfaction survey page.
 * Used in the Landing Pages admin to preview how the survey looks.
 * No actual submission — just the UI.
 */
export default function SatisfactionDemoPage() {
  async function handleDemoSubmit() {
    // No-op in demo mode — just simulate a short delay
    await new Promise((r) => setTimeout(r, 800));
  }

  return (
    <SatisfactionSurvey
      customerName="John"
      onSubmit={handleDemoSubmit}
      isDemo
    />
  );
}
