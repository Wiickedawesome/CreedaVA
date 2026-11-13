"use client";

import { useMemo } from "react";
import { useCollection } from "@/hooks/useCollection";
import type { Finding, FindingScope, FirestoreFindingFields } from "@/lib/types/findings";
import { byUrgency } from "@/lib/types/findings";

interface UseFindingsOptions {
  /** Restrict to one scope, e.g. "page" on Page Metadata. */
  scope?: FindingScope;
  /** Restrict to specific skills. Omitted means every skill in scope. */
  skills?: string[];
}

/**
 * The `findings` collection, filtered and sorted worst-first.
 *
 * One subscription per screen: a list view that also wants counts gets them
 * from the same result rather than opening a second listener.
 */
export function useFindings({ scope, skills }: UseFindingsOptions = {}) {
  const { data, loading, refetch } = useCollection<FirestoreFindingFields>("findings");

  const findings = useMemo<Finding[]>(() => {
    const skillSet = skills ? new Set(skills) : null;
    return data
      .filter((row) => !scope || row.scope === scope)
      .filter((row) => !skillSet || skillSet.has(row.skill))
      .sort(byUrgency);
  }, [data, scope, skills]);

  return { findings, loading, refetch };
}
