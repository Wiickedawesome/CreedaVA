/**
 * Source of the Firebase Cloud Messaging service worker.
 *
 * The worker must be reachable at the site root (`/firebase-messaging-sw.js`)
 * so its scope covers every page, but `public/` is NOT served by Firebase App
 * Hosting — every file in it 404s in production (measured 2026-11-11 and again
 * 2026-11-23: `creedava-mark.svg`, `logo.webp`, `firebase-messaging-sw.js`).
 * Anything that must be served has to come from an `app/` route, which is why
 * this lives as a string here and is served by
 * `app/firebase-messaging-sw.js/route.ts`.
 *
 * Keep the `firebasejs/<version>` importScripts pinned to the installed
 * `firebase` package version; the compat SDK registers the messaging backend
 * the app's modular SDK expects.
 *
 * Icons point at `/icon.svg` (an `app/` route, verified 200 in production).
 * The old `/logo.webp` reference rendered a blank notification icon because
 * that file 404s.
 */

export const MESSAGING_SW_SOURCE = `/**
 * Firebase Cloud Messaging Service Worker
 *
 * Handles push notifications while the app is in the background or closed.
 * Served from app/firebase-messaging-sw.js/route.ts — edit the source there.
 */

importScripts("https://www.gstatic.com/firebasejs/13.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.4.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBGaDhXUnmMfYsjxK9Jh5Tk3vGn78mum3U",
  authDomain: "creeda-va.firebaseapp.com",
  projectId: "creeda-va",
  storageBucket: "creeda-va.firebasestorage.app",
  messagingSenderId: "53722795216",
  appId: "1:53722795216:web:18065a250c22647774a2d5",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "CreedaVA";
  const options = {
    body: payload.notification?.body ?? "",
    icon: "/icon.svg",
    data: payload.data,
    actions: [{ action: "open", title: "View" }],
  };

  self.registration.showNotification(title, options);
});

// Open the relevant admin page when the notification is clicked.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/admin";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes("/admin") && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      }),
  );
});
`;
