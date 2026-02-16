import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeLTV } from "@/lib/utils/ltv";
import type { Customer, Project, ProjectGoal } from "@/lib/types/crm";

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

// Helper to build a minimal Project
function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "proj-1",
    name: "Website Redesign",
    status: "active",
    clientId: "cust-1",
    clientName: "Acme Corp",
    goals: [],
    phases: [],
    history: [],
    ...overrides,
  } as Project;
}

function makeGoal(overrides: Partial<ProjectGoal> = {}): ProjectGoal {
  return {
    id: "goal-1",
    title: "Launch MVP",
    status: "planning",
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
    expect(computeLTV(customer, [])).toBe(0);
  });

  it("computes recurring revenue from monthlyValue × months active", () => {
    const customer = makeCustomer({
      monthlyValue: 1500,
      startDate: "2025-08-15", // 6 months ago
    });
    // 6 months × $1500 = $9000
    expect(computeLTV(customer, [])).toBe(9000);
  });

  it("floors months active to 0 when start date is in the future", () => {
    const customer = makeCustomer({
      monthlyValue: 1000,
      startDate: "2026-05-01",
    });
    expect(computeLTV(customer, [])).toBe(0);
  });

  it("ignores recurring revenue when monthlyValue is missing", () => {
    const customer = makeCustomer({
      startDate: "2025-01-01",
    });
    expect(computeLTV(customer, [])).toBe(0);
  });

  it("ignores recurring revenue when startDate is missing", () => {
    const customer = makeCustomer({
      monthlyValue: 2000,
    });
    expect(computeLTV(customer, [])).toBe(0);
  });

  it("computes goal-based revenue from completed project goals", () => {
    const customer = makeCustomer();
    const projects = [
      makeProject({
        clientId: "cust-1",
        goals: [
          makeGoal({ status: "completed", value: 3000 }),
          makeGoal({ id: "g2", status: "completed", value: 2000 }),
          makeGoal({ id: "g3", status: "active", value: 5000 }), // not completed
        ],
      }),
    ];
    expect(computeLTV(customer, projects)).toBe(5000);
  });

  it("combines recurring + goal-based revenue", () => {
    const customer = makeCustomer({
      monthlyValue: 1000,
      startDate: "2025-12-15", // 2 months ago
    });
    const projects = [
      makeProject({
        clientId: "cust-1",
        goals: [makeGoal({ status: "completed", value: 1500 })],
      }),
    ];
    // (1000 × 2) + 1500 = 3500
    expect(computeLTV(customer, projects)).toBe(3500);
  });

  it("links projects by clientName fallback when clientId does not match", () => {
    const customer = makeCustomer({ id: "cust-99" });
    const projects = [
      makeProject({
        clientId: "other",
        clientName: "Acme Corp",
        goals: [makeGoal({ status: "completed", value: 800 })],
      }),
    ];
    expect(computeLTV(customer, projects)).toBe(800);
  });

  it("excludes unrelated projects", () => {
    const customer = makeCustomer({ id: "cust-1", name: "Acme Corp" });
    const projects = [
      makeProject({
        clientId: "other-client",
        clientName: "Other Company",
        goals: [makeGoal({ status: "completed", value: 9999 })],
      }),
    ];
    expect(computeLTV(customer, projects)).toBe(0);
  });

  it("handles goals without value field", () => {
    const customer = makeCustomer();
    const projects = [
      makeProject({
        clientId: "cust-1",
        goals: [makeGoal({ status: "completed" })], // no value
      }),
    ];
    expect(computeLTV(customer, projects)).toBe(0);
  });
});
