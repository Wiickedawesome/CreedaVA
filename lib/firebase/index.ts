export { app, auth, db } from "./config";
export { signInWithGoogle, signOut, onAuthStateChanged } from "./auth";
export type { User } from "./auth";
export {
  fetchAll,
  fetchOne,
  create,
  update,
  remove,
  subscribe,
  where,
  orderBy,
  limit,
} from "./firestore";
