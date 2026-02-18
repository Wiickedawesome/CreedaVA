'use client';

import { ForumAuthProvider } from "./forum-auth-context";

export function ForumClientProvider({ children }: { children: React.ReactNode }) {
  return <ForumAuthProvider>{children}</ForumAuthProvider>;
}
