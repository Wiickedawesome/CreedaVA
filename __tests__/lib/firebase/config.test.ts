// @vitest-environment node
import { describe, expect, it } from "vitest";
import { app, auth, db, storage } from "@/lib/firebase/config";

/**
 * The client SDK is browser-only. Server code importing these modules should
 * get a clear error on first use, not an empty object that fails later with
 * "db.collection is not a function".
 */
describe("firebase config outside the browser", () => {
  it.each([
    ["app", () => app.options],
    ["auth", () => auth.currentUser],
    ["db", () => db.app],
    ["storage", () => storage.app],
  ])("throws a descriptive error for %s", (_name, access) => {
    expect(access).toThrow(/browser-only.*Admin SDK/);
  });
});
