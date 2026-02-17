import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";

// ── Mock Firebase modules ────────────────────────────
const mockFetchAll = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();

vi.mock("@/lib/firebase/config", () => ({
  app: {},
  auth: {},
  db: {},
}));

vi.mock("@/lib/firebase/firestore", () => ({
  fetchAll: (...args: unknown[]) => mockFetchAll(...args),
  create: (...args: unknown[]) => mockCreate(...args),
  update: (...args: unknown[]) => mockUpdate(...args),
  remove: (...args: unknown[]) => mockRemove(...args),
}));

vi.mock("firebase/firestore", () => ({
  where: (field: string, op: string, value: unknown) => ({ type: "where", field, op, value }),
  orderBy: (field: string, dir: string) => ({ type: "orderBy", field, dir }),
}));

// ── Mock auth context ────────────────────────────────
const mockUseAuth = vi.fn();
vi.mock("@/lib/firebase/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

import { useCollection } from "@/hooks/useCollection";

function wrapper({ children }: { children: ReactNode }) {
  return children;
}

// Use unique collection names per test to avoid cache interference
let testCounter = 0;
function uniqueCollection() {
  return `test-collection-${++testCounter}`;
}

describe("useCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: "user1", email: "admin@creedava.com" },
      loading: false,
    });
  });

  it("fetches data on mount for authenticated user", async () => {
    const col = uniqueCollection();
    const items = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ];
    mockFetchAll.mockResolvedValue(items);

    const { result } = renderHook(
      () => useCollection<{ name: string }>(col),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(items);
    expect(result.current.error).toBeNull();
    expect(mockFetchAll).toHaveBeenCalledWith(col);
  });

  it("returns empty data when user is not authenticated", async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    const col = uniqueCollection();

    const { result } = renderHook(
      () => useCollection<{ name: string }>(col),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });

  it("returns empty data when user email is not @creedava.com", async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user2", email: "outsider@gmail.com" },
      loading: false,
    });
    const col = uniqueCollection();

    const { result } = renderHook(
      () => useCollection<{ name: string }>(col),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });

  it("handles fetch errors gracefully", async () => {
    const col = uniqueCollection();
    mockFetchAll.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useCollection<{ name: string }>(col),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
  });

  it("passes orderBy constraints", async () => {
    const col = uniqueCollection();
    mockFetchAll.mockResolvedValue([]);

    renderHook(
      () =>
        useCollection<{ name: string }>(col, {
          orderByField: "createdAt",
          orderDirection: "desc",
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(mockFetchAll).toHaveBeenCalled();
    });

    const call = mockFetchAll.mock.calls[0];
    expect(call[0]).toBe(col);
    expect(call[1]).toEqual({ type: "orderBy", field: "createdAt", dir: "desc" });
  });

  it("provides add function that creates a document", async () => {
    const col = uniqueCollection();
    mockFetchAll.mockResolvedValue([]);
    mockCreate.mockResolvedValue("new-id");

    const { result } = renderHook(
      () => useCollection<{ name: string }>(col),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const id = await result.current.add({ name: "Charlie" });
      expect(id).toBe("new-id");
    });

    expect(mockCreate).toHaveBeenCalledWith(col, { name: "Charlie" });
  });

  it("provides edit function that updates a document", async () => {
    const col = uniqueCollection();
    mockFetchAll.mockResolvedValue([{ id: "1", name: "Alice" }]);
    mockUpdate.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useCollection<{ name: string }>(col),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.edit("1", { name: "Alice Updated" });
    });

    expect(mockUpdate).toHaveBeenCalledWith(col, "1", {
      name: "Alice Updated",
    });
  });

  it("provides del function that removes a document", async () => {
    const col = uniqueCollection();
    mockFetchAll.mockResolvedValue([{ id: "1", name: "Alice" }]);
    mockRemove.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useCollection<{ name: string }>(col),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.del("1");
    });

    expect(mockRemove).toHaveBeenCalledWith(col, "1");
  });

  it("refetch triggers a new data load", async () => {
    const col = uniqueCollection();
    mockFetchAll
      .mockResolvedValueOnce([{ id: "1", name: "Alice" }])
      .mockResolvedValueOnce([
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ]);

    const { result } = renderHook(
      () => useCollection<{ name: string }>(col),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });
  });
});
