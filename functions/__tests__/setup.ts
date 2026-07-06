import { beforeAll, afterAll } from "vitest";
import * as admin from "firebase-admin";

// Initialize Firebase Admin for tests
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "test-project",
  });
}

beforeAll(() => {
  // Setup before all tests
});

afterAll(() => {
  // Cleanup after all tests
  admin.app().delete();
});