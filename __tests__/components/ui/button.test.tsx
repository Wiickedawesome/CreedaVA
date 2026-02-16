import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button component", () => {
  it("renders with default variant and size", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toBeInTheDocument();
    expect(btn.tagName).toBe("BUTTON");
  });

  it("applies primary variant by default", () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole("button", { name: "Primary" });
    expect(btn.className).toContain("bg-primary");
  });

  it("applies outline variant classes", () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByRole("button", { name: "Outline" });
    expect(btn.className).toContain("border");
  });

  it("applies ghost variant classes", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole("button", { name: "Ghost" });
    expect(btn.className).toContain("text-primary");
    expect(btn.className).not.toContain("bg-primary");
  });

  it("applies size classes", () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByRole("button", { name: "Large" });
    expect(btn.className).toContain("px-8");
  });

  it("applies sm size classes", () => {
    render(<Button size="sm">Small</Button>);
    const btn = screen.getByRole("button", { name: "Small" });
    expect(btn.className).toContain("px-4");
  });

  it("supports disabled state", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole("button", { name: "Disabled" });
    expect(btn).toBeDisabled();
  });

  it("is disabled when isLoading is true", () => {
    render(<Button isLoading>Loading</Button>);
    const btn = screen.getByRole("button", { name: "Loading" });
    expect(btn).toBeDisabled();
  });

  it("applies fullWidth class", () => {
    render(<Button fullWidth>Full Width</Button>);
    const btn = screen.getByRole("button", { name: "Full Width" });
    expect(btn.className).toContain("w-full");
  });

  it("forwards onClick handler", () => {
    let clicked = false;
    render(<Button onClick={() => (clicked = true)}>Click</Button>);
    screen.getByRole("button", { name: "Click" }).click();
    expect(clicked).toBe(true);
  });

  it("forwards custom className", () => {
    render(<Button className="my-custom-class">Custom</Button>);
    const btn = screen.getByRole("button", { name: "Custom" });
    expect(btn.className).toContain("my-custom-class");
  });
});
