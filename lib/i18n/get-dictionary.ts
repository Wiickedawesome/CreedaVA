import { cookies } from "next/headers";
import en from "./en";
import type { Dictionary } from "./en";
import type { Locale } from "./context";

let cachedEs: Dictionary | null = null;

/**
 * Server-only utility — reads the locale cookie and returns the matching
 * dictionary.  Use in Server Components and page.tsx files.
 *
 * Spanish dictionary is cached in module scope so it's only loaded once
 * per server instance, not per request.
 */
export async function getDictionary(): Promise<{ locale: Locale; t: Dictionary }> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("creedava-lang")?.value;
  const locale: Locale = raw === "es" ? "es" : "en";

  if (locale === "en") {
    return { locale, t: en };
  }

  if (!cachedEs) {
    const mod = await import("./es");
    cachedEs = mod.default;
  }

  return { locale, t: cachedEs! };
}
