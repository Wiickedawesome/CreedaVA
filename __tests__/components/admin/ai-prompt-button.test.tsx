"use client";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ─── Hoist all mocks before any import ─────────────────────────────────────
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/leads",
}));

vi.mock("@/lib/firebase/config", () => ({
  app: {},
  auth: {},
  db: {},
}));

vi.mock("@/lib/firebase/firestore", () => ({
  fetchOne: vi.fn().mockResolvedValue(null),
  fetchAll: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue("new-id"),
  update: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  subscribe: vi.fn().mockReturnValue(() => {}),
  where: vi.fn(),
  orderBy: vi.fn(),
}));

vi.mock("@/lib/utils/ai-page-context", () => ({
  loadPageAwareContext: vi.fn().mockResolvedValue({ dataContext: "" }),
}));

vi.mock("@/lib/firebase/auth-context", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/lib/firebase/ai-lazy", () => ({
  lazyGenerateText: vi.fn(),
  lazySendMessage: vi.fn(),
  lazyGetCurrentMessages: vi.fn().mockResolvedValue([]),
  lazyLogActionToMemory: vi.fn(),
  lazyGetConversationHistory: vi.fn().mockResolvedValue([]),
  lazySwitchConversation: vi.fn(),
  lazyNewConversation: vi.fn(),
  lazyConfirmAction: vi.fn(),
  lazyRejectAction: vi.fn(),
}));

vi.mock("@/lib/utils/ai-system-prompt", () => ({
  buildTrainedPrompt: vi.fn().mockResolvedValue("mocked-prompt"),
  getPageContext: vi.fn().mockReturnValue(""),
}));

vi.mock("@/components/admin", () => ({
  Modal: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/components/admin/markdown", () => ({
  Markdown: ({ content }: { content: string }) => <div>{content}</div>,
}));

vi.mock("@/components/ui", () => ({
  Button: ({ children, onClick, disabled, isLoading }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled || isLoading}>
      {children}
    </button>
  ),
}));

// Import AFTER mocks
import { AIPromptButton } from "@/components/admin/ai-prompt";

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("AIPromptButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom does not implement scrollIntoView — stub it globally
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("renders a button element", () => {
    render(<AIPromptButton section="Test" description="Test description" />);
    const btn = screen.getByRole("button");
    expect(btn).toBeInTheDocument();
  });

  it("names the single assistant in its aria-label", () => {
    render(<AIPromptButton section="Leads" description="Lead AI assistant" />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-label")).toBe("Ask Creeda AI");
  });

  it("names the area in the title without inventing a persona", () => {
    render(<AIPromptButton section="Leads" description="Lead AI assistant" />);
    const btn = screen.getByRole("button");
    const title = btn.getAttribute("title") ?? "";
    expect(title).toBe("Ask Creeda AI about Leads");
    expect(title).not.toMatch(/ARIA|ORACLE|NOVA|MAVERICK|SCOUT|GUIDE/);
  });

  it("has the ai-prompt-btn CSS class", () => {
    render(<AIPromptButton section="Leads" description="Lead AI assistant" />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("ai-prompt-btn");
  });

  it("does not render dialog before click", () => {
    render(<AIPromptButton section="Leads" description="Lead AI assistant" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog after button click", () => {
    render(
      <AIPromptButton section="Leads" description="Lead AI assistant" />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("applies sm size classes when size='sm'", () => {
    render(
      <AIPromptButton section="Test" description="desc" size="sm" />,
    );
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("h-9");
    expect(btn.className).toContain("w-9");
  });

  it("applies md size classes by default", () => {
    render(<AIPromptButton section="Test" description="desc" />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("h-10");
    expect(btn.className).toContain("w-10");
  });

  it("renders children instead of default SVG when provided", () => {
    render(
      <AIPromptButton section="Test" description="desc">
        <span data-testid="custom-child">★</span>
      </AIPromptButton>,
    );
    expect(screen.getByTestId("custom-child")).toBeInTheDocument();
  });

  it("pulse indicator spans are present in the DOM", () => {
    const { container } = render(
      <AIPromptButton section="Test" description="desc" />,
    );
    const pulseDots = container.querySelectorAll(".color-dot");
    expect(pulseDots).toHaveLength(2);
  });
});
