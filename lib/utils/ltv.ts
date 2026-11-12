import type { Customer } from "@/lib/types/crm";

/**
 * Compute a customer's Lifetime Value on the fly.
 *
 * Formula:  LTV = monthlyValue × months active
 *
 * "months active" = months between startDate and now (minimum 0).
 *
 * This used to add the value of completed project goals. Projects were removed
 * from the admin (see docs/dev/REMOVED_ADMIN_SURFACES.md), so that term is gone
 * and LTV is recurring revenue only. The sole surviving project document was
 * test data, so the number did not change for any real customer.
 */
export function computeLTV(customer: Customer): number {
  if (!customer.monthlyValue || !customer.startDate) return 0;

  const start = new Date(customer.startDate);
  const now = new Date();
  const monthsActive =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());

  return customer.monthlyValue * Math.max(0, monthsActive);
}
