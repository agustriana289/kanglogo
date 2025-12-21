"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";

export default function OneSignalProvider() {
    useEffect(() => {
        const runOneSignal = async () => {
            try {
                await OneSignal.init({
                    appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "fbaa1b70-b1de-4d5e-99c5-83ea2ba76802",
                    notifyButton: {
                        enable: true,
                        prenotify: true,
                        showCredit: false,
                        text: {
                            'tip.state.unsubscribed': 'Subscribe to notifications',
                            'tip.state.subscribed': "You are subscribed to notifications",
                            'tip.state.blocked': "You have blocked notifications",
                            'message.action.subscribed': "Thanks for subscribing!",
                            'message.action.resubscribed': "You're subscribed to notifications",
                            'message.action.unsubscribed': "You won't receive notifications again",
                            'dialog.main.title': 'Manage Notifications',
                            'dialog.main.button.subscribe': 'SUBSCRIBE',
                            'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
                            'dialog.blocked.title': 'Unblock Notifications',
                            'dialog.blocked.message': 'Follow these instructions to allow notifications:',
                            'message.action.subscribing': "Subscribing...",
                            'message.prenotify': "Click to subscribe to notifications"
                        }
                    },
                    allowLocalhostAsSecureOrigin: true,
                });
            } catch (error) {
                console.error("Error initializing OneSignal:", error);
            }
        };

        runOneSignal();
    }, []);

    return null;
}
