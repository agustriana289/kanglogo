"use client";

import { useEffect, useState, useCallback } from "react";
import {
    isPushNotificationSupported,
    requestNotificationPermission,
    getNotificationPermission,
    subscribeToNotifications,
    subscribeUserToPush,
} from "@/lib/push-notifications";

interface NotificationProviderProps {
    children: React.ReactNode;
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleRequestPermission = useCallback(async () => {
        const permission = await requestNotificationPermission();
        setPermissionStatus(permission);
        return permission;
    }, []);

    useEffect(() => {
        if (!isPushNotificationSupported()) {
            return;
        }

        // Get initial permission status
        const currentPermission = getNotificationPermission();
        setPermissionStatus(currentPermission);

        // If already granted, subscribe to notifications
        if (currentPermission === "granted" && !isSubscribed) {
            let unsubscribe: (() => void) | null = null;

            subscribeToNotifications((notification) => {
                console.log("New notification received:", notification);
            }).then((unsub) => {
                unsubscribe = unsub;
                setIsSubscribed(true);
            });

            // Also register for background push
            subscribeUserToPush().then((sub) => {
                if (sub) console.log("Subscribed to background push");
            });


            return () => {
                if (unsubscribe) {
                    unsubscribe();
                }
            };
        }
    }, [permissionStatus, isSubscribed]);

    // Auto-request permission when the component mounts (only once)
    useEffect(() => {
        if (isPushNotificationSupported() && permissionStatus === "default") {
            // Auto-request permission on mount for better UX
            handleRequestPermission();
        }
    }, [permissionStatus, handleRequestPermission]);

    return <>{children}</>;
}

// Hook for components to use notification features
export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        setIsSupported(isPushNotificationSupported());
        if (isPushNotificationSupported()) {
            setPermission(getNotificationPermission());
        }
    }, []);

    const requestPermission = useCallback(async () => {
        const newPermission = await requestNotificationPermission();
        setPermission(newPermission);
        return newPermission;
    }, []);

    return {
        isSupported,
        permission,
        requestPermission,
    };
}
