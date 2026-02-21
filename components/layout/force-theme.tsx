"use client";

import { useEffect } from "react";

export function ForceTheme({ theme }: { theme: "light" | "dark" }) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
}
