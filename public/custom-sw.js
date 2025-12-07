// public/custom-sw.js
// Custom service worker for handling push notifications

self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || "/admin";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
            // Check if there's already a window/tab open with the URL
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(urlToOpen) && "focus" in client) {
                    return client.focus();
                }
            }
            // If no window/tab is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

self.addEventListener("push", function (event) {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.message || data.body || "",
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            data: {
                url: data.link || data.url || "/admin",
            },
            vibrate: [100, 50, 100],
            requireInteraction: true,
        };

        event.waitUntil(
            self.registration.showNotification(data.title || "Notifikasi Baru", options)
        );
    } catch (e) {
        console.error("Error parsing push notification:", e);
    }
});
