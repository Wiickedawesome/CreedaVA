'use client';

import { ForumAuthProvider } from "./forum-auth-context";

/**
 * Client boundary for the forum.
 *
 * It used to be loaded with `dynamic(..., { ssr: false })`, which kept the whole
 * list out of the served HTML. The auth provider only touches Firebase inside
 * `useEffect`, and `lib/firebase/config.ts` already degrades to throwing proxies
 * on the server, so rendering it server-side is safe.
 */
export function ForumClientProvider({ children }: { children: React.ReactNode }) {
  return <ForumAuthProvider>{children}</ForumAuthProvider>;
}
