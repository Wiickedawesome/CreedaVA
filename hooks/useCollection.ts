"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchAll,
  create,
  update,
  remove,
  type WhereFilterOp,
} from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/auth-context";
import { where, orderBy, type QueryConstraint } from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";

interface UseCollectionOptions {
  orderByField?: string;
  orderDirection?: "asc" | "desc";
  filters?: { field: string; op: WhereFilterOp; value: unknown }[];
}

interface UseCollectionReturn<T> {
  data: (T & { id: string })[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  add: (item: Omit<T, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  edit: (id: string, updates: Partial<T>) => Promise<void>;
  del: (id: string) => Promise<void>;
}

// ─── Shared in-memory cache ──────────────────────────
// Survives across page navigations so returning to a page is instant.
const cache = new Map<string, { data: unknown[]; ts: number }>();

function getCacheKey(name: string, opts: UseCollectionOptions) {
  return `${name}:${JSON.stringify(opts)}`;
}

export function useCollection<T extends DocumentData>(
  collectionName: string,
  options: UseCollectionOptions = {},
): UseCollectionReturn<T> {
  const { user, loading: authLoading } = useAuth();
  const key = getCacheKey(collectionName, options);
  const cached = cache.get(key);

  // Initialise from cache if available (instant render on re-visit)
  const [data, setData] = useState<(T & { id: string })[]>(
    cached ? (cached.data as (T & { id: string })[]) : [],
  );
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Manual refetch trigger
  const refetch = useCallback(() => setFetchTrigger((n) => n + 1), []);

  useEffect(() => {
    mountedRef.current = true;

    // ── Don't fetch until auth is resolved & valid ──────────
    if (authLoading) return;
    if (!user || !user.email?.endsWith("@creedava.com")) {
      setLoading(false);
      setData([]);
      return;
    }

    const constraints: QueryConstraint[] = [];

    if (options.filters) {
      for (const f of options.filters) {
        constraints.push(where(f.field, f.op, f.value));
      }
    }

    if (options.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || "desc"));
    }

    // Use one-shot getDocs instead of onSnapshot to avoid
    // Firebase SDK internal assertion crash on permission errors
    let cancelled = false;
    setLoading(true);

    fetchAll<T>(collectionName, ...constraints)
      .then((items) => {
        if (cancelled || !mountedRef.current) return;
        setData(items);
        setLoading(false);
        setError(null);
        cache.set(key, { data: items, ts: Date.now() });
      })
      .catch((err) => {
        if (cancelled || !mountedRef.current) return;
        const msg = err instanceof Error ? err.message : "Failed to load";
        console.warn(`[Firestore] ${collectionName} fetch error:`, msg);
        setError(msg);
        setLoading(false);
        // Use cached data if available
        if (!cached) setData([]);
      });

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, key, user, authLoading, fetchTrigger]);

  const add = useCallback(
    async (item: Omit<T, "id" | "createdAt" | "updatedAt">) => {
      try {
        const id = await create(collectionName, item as DocumentData);
        refetch(); // Refresh data since we no longer use real-time listeners
        return id;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create";
        setError(msg);
        throw err;
      }
    },
    [collectionName, refetch],
  );

  const edit = useCallback(
    async (id: string, updates: Partial<T>) => {
      try {
        await update(collectionName, id, updates as DocumentData);
        refetch();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update";
        setError(msg);
        throw err;
      }
    },
    [collectionName, refetch],
  );

  const del = useCallback(
    async (id: string) => {
      try {
        await remove(collectionName, id);
        refetch();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to delete";
        setError(msg);
        throw err;
      }
    },
    [collectionName, refetch],
  );

  return { data, loading, error, refetch, add, edit, del };
}
