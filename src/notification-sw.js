/* eslint-disable no-undef */
/**
 * Push service worker for approval notifications.
 *
 * Served from the application root (see the angular.json assets entry) so its scope covers every
 * route — a worker served from /assets/ could only control /assets/ and would never receive these
 * events. Registered by NotificationFeedService.registerPush().
 *
 * The payload is the NotificationPushPayload the backend serializes in
 * NotificationService.SendPushNotificationAsync: { notification, unreadCount, timestamp }.
 */

/** Where a notification with no explicit url sends the user. */
const FALLBACK_URL = '/approvals';

self.addEventListener('install', () => {
  // Take over immediately instead of waiting for existing tabs to close, so a freshly registered
  // worker can receive pushes during this session rather than only the next one.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    // Never surface a raw/undecodable body as notification text.
    return;
  }

  const notification = payload && payload.notification;
  if (!notification) return;

  const title = notification.title || 'Notification';
  const options = {
    body: notification.message || '',
    icon: notification.image || '/assets/images/logo.png',
    badge: '/assets/images/logo.png',
    // Everything notificationclick needs, carried on the notification itself — the service
    // worker may well be restarted between the push and the click, losing any other state.
    data: {
      url: notification.url || FALLBACK_URL,
      notificationId: notification.id,
      referenceId: notification.referenceId,
      referenceType: notification.referenceType,
      documentNo: notification.documentNo,
    },
    // Collapses repeat pushes about the same document into one entry instead of stacking them.
    tag: notification.referenceType
      ? `${notification.referenceType}-${notification.referenceId}`
      : `notification-${notification.id}`,
    renotify: true,
    requireInteraction:
      notification.priority === 'High' || notification.priority === 'Urgent',
    timestamp: Date.parse(notification.createdDate) || Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // Keep the app-icon badge in step with the server's authoritative unread count.
      if (typeof payload.unreadCount === 'number' && 'setAppBadge' in self.navigator) {
        return self.navigator.setAppBadge(payload.unreadCount).catch(() => undefined);
      }
      return undefined;
    }),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || FALLBACK_URL;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Prefer focusing a tab that is already open and telling it to route internally: a full
        // openWindow() would reload the SPA and lose in-memory state.
        for (const client of clientList) {
          if ('focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: targetUrl,
              notificationId: data.notificationId,
            });
            return client.focus();
          }
        }

        // No tab open — launch one straight at the document.
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      }),
  );
});
