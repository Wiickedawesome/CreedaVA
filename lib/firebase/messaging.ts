/**
 * Firebase Cloud Messaging (FCM) — push notifications.
 *
 * Sends real-time push notifications to admin users for:
 *   - New leads / contacts
 *   - Booking confirmations / cancellations
 *   - Forum replies
 *   - Campaign performance alerts
 *
 * Prerequisites:
 *   1. Enable Cloud Messaging in Firebase Console
 *   2. Generate a VAPID key (Firebase Console → Cloud Messaging → Web Push certificates)
 *   3. Set NEXT_PUBLIC_FIREBASE_VAPID_KEY in env
 *   4. Deploy the service worker (public/firebase-messaging-sw.js)
 *
 * @see https://firebase.google.com/docs/cloud-messaging/js/client
 */

import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { app } from "./config";

let _messaging: Messaging | null = null;

/**
 * Initialize FCM. Returns null on the server or if messaging is unsupported.
 */
function getMessagingInstance(): Messaging | null {
  if (typeof window === "undefined") return null;
  if (_messaging) return _messaging;

  try {
    _messaging = getMessaging(app);
    return _messaging;
  } catch (error) {
    console.warn("[FCM] Failed to initialize:", error);
    return null;
  }
}

/**
 * Request notification permission and get the FCM registration token.
 * The token should be saved to Firestore (e.g., under the user's profile)
 * so Cloud Functions can target it for push notifications.
 *
 * @returns The FCM token, or null if permission was denied or unavailable.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  const messaging = getMessagingInstance();
  if (!messaging) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn(
      "[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set. Push notifications are disabled.",
    );
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.info("[FCM] Notification permission denied by user.");
      return null;
    }

    // Register the service worker for background messages
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    return token;
  } catch (error) {
    console.warn("[FCM] Failed to get token:", error);
    return null;
  }
}

/** Notification payload shape from FCM */
export interface FCMNotification {
  title: string;
  body: string;
  icon?: string;
  clickAction?: string;
  data?: Record<string, string>;
}

/**
 * Listen for foreground messages.
 * Call in a client component to handle notifications while the app is open.
 *
 * @example
 * useEffect(() => {
 *   const unsubscribe = onForegroundMessage((notification) => {
 *     showToast(notification.title, notification.body);
 *   });
 *   return unsubscribe;
 * }, []);
 */
export function onForegroundMessage(
  callback: (notification: FCMNotification) => void,
): (() => void) | undefined {
  const messaging = getMessagingInstance();
  if (!messaging) return undefined;

  return onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title ?? "Notification",
      body: payload.notification?.body ?? "",
      icon: payload.notification?.icon,
      data: payload.data,
    });
  });
}
