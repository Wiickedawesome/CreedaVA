import type { Customer, Project } from "@/lib/types/crm";

/**
 * Compute a customer's Lifetime Value on the fly.
 *
 * Formula:  LTV = (monthlyValue × months active) + Σ completed-goal values
 *
 * - "months active" = months between startDate and now (minimum 0)
 * - completed-goal values come from all projects linked to this customer
 */
export function computeLTV(
  customer: Customer,
  projects: Project[],
): number {
  // ── Recurring revenue portion ──────────────────────
  let recurringRevenue = 0;
  if (customer.monthlyValue && customer.startDate) {
    const start = new Date(customer.startDate);
    const now = new Date();
    const monthsActive =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());
    recurringRevenue = customer.monthlyValue * Math.max(0, monthsActive);
  }

  // ── Goal-based revenue portion ─────────────────────
  const linkedProjects = projects.filter(
    (p) => p.clientId === customer.id || p.clientName === customer.name,
  );
  const goalRevenue = linkedProjects.reduce((sum, p) => {
    const completedGoals = (p.goals || []).filter((g) => g.status === "completed");
    return sum + completedGoals.reduce((s, g) => s + (g.value || 0), 0);
  }, 0);

  return recurringRevenue + goalRevenue;
}
