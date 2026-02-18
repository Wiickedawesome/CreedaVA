import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Firebase Messaging ──────────────────────────
const mockGetMessaging = vi.fn();
const mockGetToken = vi.fn();
const mockOnMessage = vi.fn();

vi.mock("firebase/messaging", () => ({
  getMessaging: (...args: unknown[]) => mockGetMessaging(...args),
  getToken: (...args: unknown[]) => mockGetToken(...args),
  onMessage: (...args: unknown[]) => mockOnMessage(...args),
}));

vi.mock("@/lib/firebase/config", () => ({
  app: { name: "mock-app" },
}));

// Mock browser APIs
const mockRequestPermission = vi.fn();
const mockRegister = vi.fn();

vi.stubGlobal("Notification", { requestPermission: mockRequestPermission });
vi.stubGlobal("navigator", {
  serviceWorker: { register: mockRegister },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("Firebase Messaging", () => {
  it("requestNotificationPermission returns null when VAPID key is not set", async () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    mockGetMessaging.mockReturnValue({ name: "messaging" });

    const { requestNotificationPermission } = await import("@/lib/firebase/messaging");
    const token = await requestNotificationPermission();

    expect(token).toBeNull();
  });

  it("requestNotificationPermission returns null when permission denied", async () => {
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY = "test-vapid-key";
    mockGetMessaging.mockReturnValue({ name: "messaging" });
    mockRequestPermission.mockResolvedValue("denied");

    const { requestNotificationPermission } = await import("@/lib/firebase/messaging");
    const token = await requestNotificationPermission();

    expect(token).toBeNull();
  });

  it("requestNotificationPermission returns token on success", async () => {
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY = "test-vapid-key";
    const fakeMessaging = { name: "messaging" };
    const fakeRegistration = { scope: "/" };

    mockGetMessaging.mockReturnValue(fakeMessaging);
    mockRequestPermission.mockResolvedValue("granted");
    mockRegister.mockResolvedValue(fakeRegistration);
    mockGetToken.mockResolvedValue("fcm-token-abc123");

    const { requestNotificationPermission } = await import("@/lib/firebase/messaging");
    const token = await requestNotificationPermission();

    expect(token).toBe("fcm-token-abc123");
    expect(mockRegister).toHaveBeenCalledWith("/firebase-messaging-sw.js");
    expect(mockGetToken).toHaveBeenCalledWith(fakeMessaging, {
      vapidKey: "test-vapid-key",
      serviceWorkerRegistration: fakeRegistration,
    });
  });

  it("requestNotificationPermission handles errors gracefully", async () => {
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY = "test-vapid-key";
    mockGetMessaging.mockReturnValue({ name: "messaging" });
    mockRequestPermission.mockRejectedValue(new Error("Permission API error"));

    const { requestNotificationPermission } = await import("@/lib/firebase/messaging");
    const token = await requestNotificationPermission();

    expect(token).toBeNull();
  });

  it("onForegroundMessage subscribes to messages", async () => {
    const fakeMessaging = { name: "messaging" };
    const mockUnsubscribe = vi.fn();
    mockGetMessaging.mockReturnValue(fakeMessaging);
    mockOnMessage.mockReturnValue(mockUnsubscribe);

    const { onForegroundMessage } = await import("@/lib/firebase/messaging");
    const callback = vi.fn();
    const unsub = onForegroundMessage(callback);

    expect(unsub).toBe(mockUnsubscribe);
    expect(mockOnMessage).toHaveBeenCalledWith(fakeMessaging, expect.any(Function));

    // Simulate a message by calling the internal handler
    const internalCallback = mockOnMessage.mock.calls[0][1];
    internalCallback({
      notification: { title: "New Lead", body: "John Doe submitted a form" },
      data: { type: "lead" },
    });

    expect(callback).toHaveBeenCalledWith({
      title: "New Lead",
      body: "John Doe submitted a form",
      icon: undefined,
      data: { type: "lead" },
    });
  });

  it("onForegroundMessage handles missing notification fields", async () => {
    const fakeMessaging = { name: "messaging" };
    mockGetMessaging.mockReturnValue(fakeMessaging);
    mockOnMessage.mockReturnValue(vi.fn());

    const { onForegroundMessage } = await import("@/lib/firebase/messaging");
    const callback = vi.fn();
    onForegroundMessage(callback);

    const internalCallback = mockOnMessage.mock.calls[0][1];
    internalCallback({ data: {} });

    expect(callback).toHaveBeenCalledWith({
      title: "Notification",
      body: "",
      icon: undefined,
      data: {},
    });
  });
});
