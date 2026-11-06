"use client";

import { ForumList } from "./forum-list";
import { useForumAuth } from "./forum-auth-context";
import { useTranslation } from "@/lib/i18n";
import { useState } from "react";
import dynamic from "next/dynamic";

const ForumClientProvider = dynamic(
  () =>
    import("./forum-client-provider").then((mod) => mod.ForumClientProvider),
  {
    ssr: false,
    loading: () => <div className="min-h-[60vh]" />,
  }
);

function ForumHeader() {
  const { t } = useTranslation();
  const { user, profile, logOut } = useForumAuth();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="border-b border-mk-line bg-mk-white">
      <div className="px-6 lg:px-10 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-mk-ink">
            {t.forum.title}
          </h2>
          <p className="text-sm text-mk-ink-mute">{t.forum.subtitle}</p>
        </div>

        {user && profile && (
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 text-xs text-mk-ink-mute hover:text-mk-ink transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-mk-brand text-white flex items-center justify-center text-xs font-bold uppercase">
                {profile.displayName.charAt(0)}
              </span>
              <span className="hidden sm:inline text-sm">{profile.displayName}</span>
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-1 bg-mk-white border border-mk-line rounded shadow-lg py-1 min-w-30 z-10">
                <div className="px-3 py-1.5 text-xs text-mk-ink-mute border-b border-mk-line">
                  {profile.email}
                </div>
                <button
                  onClick={() => {
                    logOut();
                    setShowProfile(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-mk-ink-mute hover:bg-mk-paper-deep transition-colors"
                >
                  {t.forum.logOut}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ForumBody() {
  return (
    <div className="px-6 lg:px-10 py-6">
      <ForumList />
    </div>
  );
}

export function ForumContent() {
  return (
    <ForumClientProvider>
      <div className="min-h-[60vh] bg-mk-paper">
        <ForumHeader />
        <ForumBody />
      </div>
    </ForumClientProvider>
  );
}
