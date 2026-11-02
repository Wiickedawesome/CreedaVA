"use client";

import { useEffect } from "react";

export function ForceTheme({ theme }: { theme: "light" | "dark" }) {
  useEffect(() => {
    if (theme === "light") {
      // Public pages have no dark variant. Removing the attribute (rather than
      // setting data-theme="light") fully reverts to the :root light defaults,
      // including `color-scheme`.
      delete document.documentElement.dataset.theme;
      return;
    }
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
}
