import { MESSAGING_SW_SOURCE } from "@/lib/firebase/messaging-sw-source";

/**
 * Serve the Firebase Cloud Messaging worker at the root path browsers expect.
 *
 * A service worker cannot be an imported module or a `public/` file here —
 * `public/` is not part of the App Hosting deployment — so this route is the
 * only URL that actually resolves in production.
 */
export function GET(): Response {
  return new Response(MESSAGING_SW_SOURCE, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // Service workers must revalidate so a new deploy takes effect even for
      // an installed worker.
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
