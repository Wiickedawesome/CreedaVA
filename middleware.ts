/**
 * Next.js Middleware entry point.
 *
 * Next.js REQUIRES this file to be named `middleware.ts` at the project root.
 * The implementation lives in `proxy.ts` — edit route logic there.
 *
 * Re-exports the middleware function and route matcher config from proxy.ts.
 */
export { proxy as default, config } from "./proxy";
