import { describe, it, expect } from "vitest";

// ai-tools.ts imports from @google/generative-ai but only uses types + SchemaType enum.
// No Firebase mocks needed — this module is purely declarative.

import {
  TOOL_REGISTRY,
  ALL_TOOLS,
  getToolsForDomains,
  getToolsByRisk,
  requiresConfirmation,
} from "@/lib/firebase/ai-tools";

describe("AI Tool Declarations", () => {
  // ─── Tool Registry ─────────────────────────────────

  describe("TOOL_REGISTRY", () => {
    it("contains at least 20 tools", () => {
      const count = Object.keys(TOOL_REGISTRY).length;
      expect(count).toBeGreaterThanOrEqual(20);
    });

    it("every entry has name, domain, and risk", () => {
      for (const [key, meta] of Object.entries(TOOL_REGISTRY)) {
        expect(meta.name).toBe(key);
        expect(meta.domain).toBeTruthy();
        expect(["read-only", "draft", "auto", "destructive"]).toContain(
          meta.risk,
        );
      }
    });

    it("has calendar tools classified as read-only", () => {
      expect(TOOL_REGISTRY["list_calendar_events"]?.risk).toBe("read-only");
      expect(TOOL_REGISTRY["get_available_slots"]?.risk).toBe("read-only");
    });

    it("has email read tools as read-only and send as destructive", () => {
      expect(TOOL_REGISTRY["read_inbox"]?.risk).toBe("read-only");
      expect(TOOL_REGISTRY["send_email"]?.risk).toBe("destructive");
      expect(TOOL_REGISTRY["send_bulk_email"]?.risk).toBe("destructive");
    });

    it("has forum thread creation as auto (low-risk, high SEO value)", () => {
      expect(TOOL_REGISTRY["create_forum_thread"]?.risk).toBe("auto");
      expect(TOOL_REGISTRY["reply_to_thread"]?.risk).toBe("auto");
    });

    it("has blog publishing as destructive", () => {
      expect(TOOL_REGISTRY["publish_blog_post"]?.risk).toBe("destructive");
    });

    it("has CRM read tools as read-only", () => {
      expect(TOOL_REGISTRY["search_leads"]?.risk).toBe("read-only");
      expect(TOOL_REGISTRY["search_customers"]?.risk).toBe("read-only");
      expect(TOOL_REGISTRY["get_lead_details"]?.risk).toBe("read-only");
    });
  });

  // ─── ALL_TOOLS ──────────────────────────────────────

  describe("ALL_TOOLS", () => {
    it("has functionDeclarations array", () => {
      expect(ALL_TOOLS.functionDeclarations).toBeDefined();
      expect(Array.isArray(ALL_TOOLS.functionDeclarations)).toBe(true);
    });

    it("every declaration has name and description", () => {
      for (const decl of ALL_TOOLS.functionDeclarations!) {
        expect(decl.name).toBeTruthy();
        expect(decl.description).toBeTruthy();
      }
    });

    it("declaration names match registry keys", () => {
      const declNames = new Set(
        ALL_TOOLS.functionDeclarations!.map((d) => d.name),
      );
      const registryNames = new Set(Object.keys(TOOL_REGISTRY));
      // Every registry tool should have a declaration
      for (const name of registryNames) {
        expect(declNames.has(name)).toBe(true);
      }
    });
  });

  // ─── getToolsForDomains ─────────────────────────────

  describe("getToolsForDomains", () => {
    it("filters to only calendar domain", () => {
      const result = getToolsForDomains(["calendar"]);
      expect(result.functionDeclarations).toBeDefined();
      for (const decl of result.functionDeclarations!) {
        expect(TOOL_REGISTRY[decl.name]?.domain).toBe("calendar");
      }
    });

    it("returns empty for unknown domain", () => {
      const result = getToolsForDomains(["nonexistent"]);
      expect(result.functionDeclarations?.length ?? 0).toBe(0);
    });

    it("combines multiple domains", () => {
      const result = getToolsForDomains(["calendar", "email"]);
      const names = result.functionDeclarations!.map((d) => d.name);
      expect(names).toContain("list_calendar_events");
      expect(names).toContain("read_inbox");
    });
  });

  // ─── getToolsByRisk ─────────────────────────────────

  describe("getToolsByRisk", () => {
    it("returns all four risk levels", () => {
      const byRisk = getToolsByRisk();
      expect(byRisk).toHaveProperty("read-only");
      expect(byRisk).toHaveProperty("draft");
      expect(byRisk).toHaveProperty("auto");
      expect(byRisk).toHaveProperty("destructive");
    });

    it("read-only has at least 5 tools", () => {
      const byRisk = getToolsByRisk();
      expect(byRisk["read-only"].length).toBeGreaterThanOrEqual(5);
    });

    it("destructive list includes send_email", () => {
      const byRisk = getToolsByRisk();
      expect(byRisk["destructive"]).toContain("send_email");
    });

    it("total across all risks matches registry count", () => {
      const byRisk = getToolsByRisk();
      const total = Object.values(byRisk).flat().length;
      expect(total).toBe(Object.keys(TOOL_REGISTRY).length);
    });
  });

  // ─── requiresConfirmation ───────────────────────────

  describe("requiresConfirmation", () => {
    it("returns true for destructive tools", () => {
      expect(requiresConfirmation("send_email")).toBe(true);
      expect(requiresConfirmation("send_bulk_email")).toBe(true);
      expect(requiresConfirmation("publish_blog_post")).toBe(true);
    });

    it("returns false for read-only tools", () => {
      expect(requiresConfirmation("list_calendar_events")).toBe(false);
      expect(requiresConfirmation("read_inbox")).toBe(false);
    });

    it("returns false for auto tools", () => {
      expect(requiresConfirmation("create_forum_thread")).toBe(false);
    });

    it("returns false for unknown tools", () => {
      expect(requiresConfirmation("totally_unknown")).toBe(false);
    });
  });
});
