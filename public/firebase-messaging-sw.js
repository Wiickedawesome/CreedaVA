/**
 * Firebase Cloud Messaging Service Worker
 *
 * Handles push notifications when the app is in the background or closed.
 * This file MUST live at public/firebase-messaging-sw.js so the browser
 * can register it at the root scope.
 *
 * @see https://firebase.google.com/docs/cloud-messaging/js/receive
 */

/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js");

// Minimal config — only what the service worker needs
firebase.initializeApp({
  apiKey: "AIzaSyBGaDhXUnmMfYsjxK9Jh5Tk3vGn78mum3U",
  authDomain: "creeda-va.firebaseapp.com",
  projectId: "creeda-va",
  storageBucket: "creeda-va.firebasestorage.app",
  messagingSenderId: "53722795216",
  appId: "1:53722795216:web:18065a250c22647774a2d5",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "CreedaVA";
  const options = {
    body: payload.notification?.body ?? "",
    icon: "/logo.webp",
    badge: "/logo.webp",
    data: payload.data,
    // Clicking the notification opens the admin dashboard
    actions: [{ action: "open", title: "View" }],
  };

  self.registration.showNotification(title, options);
});

// Handle notification click — open the relevant admin page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/admin";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing tab if open
        for (const client of windowClients) {
          if (client.url.includes("/admin") && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open a new tab
        return clients.openWindow(url);
      }),
  );
});
