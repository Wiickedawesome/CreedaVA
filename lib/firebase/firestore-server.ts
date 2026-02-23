/**
 * Server-side Firestore helpers using Firebase Admin SDK.
 *
 * Use these in Server Components and `generateMetadata` instead of the
 * client-side helpers from `./firestore.ts`, which depend on a browser
 * environment.
 *
 * Import ONLY from server files (Server Components, API routes, Server Actions):
 *   import { fetchAllServer } from "@/lib/firebase/firestore-server";
 */

import { adminDb } from "@/lib/firebase-admin";

// ─── Simple constraint types mirroring client SDK ──────
export interface WhereConstraint {
  type: "where";
  field: string;
  op: FirebaseFirestore.WhereFilterOp;
  value: unknown;
}

export interface OrderByConstraint {
  type: "orderBy";
  field: string;
  direction?: "asc" | "desc";
}

export type ServerConstraint = WhereConstraint | OrderByConstraint;

/** Create a `where` constraint for server queries. */
export function serverWhere(
  field: string,
  op: FirebaseFirestore.WhereFilterOp,
  value: unknown,
): WhereConstraint {
  return { type: "where", field, op, value };
}

/** Create an `orderBy` constraint for server queries. */
export function serverOrderBy(
  field: string,
  direction?: "asc" | "desc",
): OrderByConstraint {
  return { type: "orderBy", field, direction };
}

// ─── Query helpers ─────────────────────────────────────

/**
 * Fetch all matching documents from a collection (server-side).
 * Mirrors the client-side `fetchAll<T>()` API.
 */
export async function fetchAllServer<T extends FirebaseFirestore.DocumentData>(
  collectionName: string,
  ...constraints: ServerConstraint[]
): Promise<(T & { id: string })[]> {
  let q: FirebaseFirestore.Query = adminDb.collection(collectionName);

  for (const c of constraints) {
    if (c.type === "where") {
      q = q.where(c.field, c.op, c.value);
    } else if (c.type === "orderBy") {
      q = q.orderBy(c.field, c.direction ?? "asc");
    }
  }

  const snapshot = await q.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as T),
  }));
}

/**
 * Fetch a single document by ID (server-side).
 * Mirrors the client-side `fetchOne<T>()` API.
 */
export async function fetchOneServer<T extends FirebaseFirestore.DocumentData>(
  collectionName: string,
  docId: string,
): Promise<(T & { id: string }) | null> {
  const doc = await adminDb.collection(collectionName).doc(docId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as T) };
}
