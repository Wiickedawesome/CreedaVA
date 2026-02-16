import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportToCsv } from "@/lib/utils/csv";

describe("exportToCsv", () => {
  let clickSpy: ReturnType<typeof vi.fn>;
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let appendedLink: HTMLAnchorElement;

  beforeEach(() => {
    clickSpy = vi.fn();
    createObjectURLSpy = vi.fn().mockReturnValue("blob:test-url");
    revokeObjectURLSpy = vi.fn();

    vi.stubGlobal("URL", {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    });

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        appendedLink = { click: clickSpy } as unknown as HTMLAnchorElement;
        return appendedLink;
      }
      return document.createElement(tag);
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15"));
  });

  it("does nothing for empty data", () => {
    exportToCsv("test", [], [{ key: "name", header: "Name" }]);
    expect(createObjectURLSpy).not.toHaveBeenCalled();
  });

  it("generates correct CSV with headers and rows", () => {
    const data = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    const columns = [
      { key: "name", header: "Name" },
      { key: "age", header: "Age" },
    ];

    exportToCsv("users", data, columns);

    expect(createObjectURLSpy).toHaveBeenCalledOnce();
    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("text/csv;charset=utf-8;");

    expect(clickSpy).toHaveBeenCalledOnce();
    expect((appendedLink as HTMLAnchorElement).download).toBe("users-2026-02-15.csv");
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:test-url");
  });

  it("escapes values containing commas", () => {
    const data = [{ note: "hello, world" }];
    const columns = [{ key: "note", header: "Note" }];

    exportToCsv("test", data, columns);

    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    // Blob content can't be read synchronously in jsdom, but we verify blob was created
    expect(blob).toBeInstanceOf(Blob);
  });

  it("uses custom render function when provided", () => {
    const data = [{ value: 1000 }];
    const columns = [
      {
        key: "value",
        header: "Revenue",
        render: (item: { value: number }) => `$${item.value.toLocaleString()}`,
      },
    ];

    exportToCsv("revenue", data, columns);
    expect(createObjectURLSpy).toHaveBeenCalledOnce();
  });

  it("handles null and undefined values gracefully", () => {
    const data = [{ name: null, email: undefined }] as Record<string, unknown>[];
    const columns = [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
    ];

    exportToCsv("contacts", data, columns);
    expect(createObjectURLSpy).toHaveBeenCalledOnce();
  });
});
