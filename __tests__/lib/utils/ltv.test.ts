import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeLTV } from "@/lib/utils/ltv";
import type { Customer } from "@/lib/types/crm";

// Helper to build a minimal Customer
function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "cust-1",
    name: "Acme Corp",
    email: "acme@test.com",
    status: "active",
    ...overrides,
  };
}

describe("computeLTV", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15"));
  });

  it("returns 0 for a customer with no revenue data", () => {
    const customer = makeCustomer();
    expect(computeLTV(customer)).toBe(0);
  });

  it("computes recurring revenue from monthlyValue × months active", () => {
    const customer = makeCustomer({
      monthlyValue: 1500,
      startDate: "2025-08-15", // 6 months ago
    });
    // 6 months × $1500 = $9000
    expect(computeLTV(customer)).toBe(9000);
  });

  it("floors months active to 0 when start date is in the future", () => {
    const customer = makeCustomer({
      monthlyValue: 1000,
      startDate: "2026-05-01",
    });
    expect(computeLTV(customer)).toBe(0);
  });

  it("ignores recurring revenue when monthlyValue is missing", () => {
    const customer = makeCustomer({
      startDate: "2025-01-01",
    });
    expect(computeLTV(customer)).toBe(0);
  });

  it("ignores recurring revenue when startDate is missing", () => {
    const customer = makeCustomer({
      monthlyValue: 2000,
    });
    expect(computeLTV(customer)).toBe(0);
  });
});
