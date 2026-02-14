import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
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

export async function update(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>,
): Promise<void> {
  const docRef = getDocRef(collectionName, docId);
  await updateDoc(docRef, {
    ...data,
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
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as T),
    }));
    callback(data);
  });
}

// Re-export query helpers for convenience
export { where, orderBy, limit, serverTimestamp, type WhereFilterOp };
