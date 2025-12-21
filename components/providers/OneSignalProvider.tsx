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
