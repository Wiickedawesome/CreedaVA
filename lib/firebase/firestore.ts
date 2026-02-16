import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
  type WhereFilterOp,
} from "firebase/firestore";
import { db } from "./config";

// Generic typed collection helper
export function getCollection(collectionName: string) {
  return collection(db, collectionName);
}

export function getDocRef(collectionName: string, docId: string) {
  return doc(db, collectionName, docId);
}

// CRUD operations
export async function fetchAll<T extends DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<(T & { id: string })[]> {
  const q = query(getCollection(collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as T),
  }));
}

export async function fetchOne<T extends DocumentData>(
  collectionName: string,
  docId: string,
): Promise<(T & { id: string }) | null> {
  const docRef = getDocRef(collectionName, docId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as T) };
}

export async function create<T extends DocumentData>(
  collectionName: string,
  data: T,
): Promise<string> {
  const docRef = await addDoc(getCollection(collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Create or overwrite a document with a specific ID (merge mode).
 * Used for integration configs where the provider name IS the doc ID.
 */
export async function createWithId<T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T,
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function update(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>,
): Promise<void> {
  const docRef = getDocRef(collectionName, docId);
  // Strip undefined values — Firestore updateDoc rejects them
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined),
  );
  await updateDoc(docRef, {
    ...clean,
    updatedAt: serverTimestamp(),
  });
}

export async function remove(
  collectionName: string,
  docId: string,
): Promise<void> {
  const docRef = getDocRef(collectionName, docId);
  await deleteDoc(docRef);
}

// Real-time listener
export function subscribe<T extends DocumentData>(
  collectionName: string,
  callback: (data: (T & { id: string })[]) => void,
  ...constraints: QueryConstraint[]
) {
  const q = query(getCollection(collectionName), ...constraints);
  try {
    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as T),
        }));
        callback(data);
      },
      (error) => {
        console.warn(`[Firestore] ${collectionName} listener error:`, error.message);
        // Return empty array so the page doesn't hang at loading forever
        callback([]);
      },
    );
  } catch (error) {
    console.warn(`[Firestore] Failed to create ${collectionName} listener:`, error);
    callback([]);
    // Return no-op unsubscribe
    return () => {};
  }
}

// Re-export query helpers for convenience
export { where, orderBy, limit, serverTimestamp, type WhereFilterOp };
