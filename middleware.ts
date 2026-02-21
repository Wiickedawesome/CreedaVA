/**
 * Next.js Middleware entry point.
 *
 * Next.js REQUIRES this file to be named `middleware.ts` at the project root.
 * The implementation lives in `proxy.ts` — edit route logic there.
 *
 * IMPORTANT: `config` (the matcher) MUST be a static object literal here in
 * middleware.ts — Next.js parses this file statically at build time and cannot
 * resolve a re-exported value from another module. Re-exporting config from
 * proxy.ts caused the matcher to be silently ignored, making the middleware run
 * on every route (including /login), which created an infinite redirect loop.
 */
export { proxy as default } from "./proxy";

export const config = {
  matcher: ["/admin/:path*"],
};
