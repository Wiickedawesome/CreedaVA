import type { ForumThread } from "./content";
import type { Timestamp } from "firebase/firestore";

/**
 * A forum thread as either side of the RSC boundary can supply it.
 *
 * Firestore `Timestamp` objects cannot be serialised across that boundary, so
 * the server sends ISO strings. `toDate()` in the client already accepts both,
 * which means one type can describe a thread from either source.
 */
export type ForumThreadRow = Omit<ForumThread, "createdAt" | "updatedAt"> & {
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
};
