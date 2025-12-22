"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function SeoTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const lastTrackedPath = useRef<string | null>(null);

    useEffect(() => {
        // Construct full URL path including query params if strictly needed,
        // but usually pathname is enough for aggregation.
        // Let's just track pathname to keep stats clean.
        const currentPath = pathname;

        // Prevent double tracking if the component re-renders but path hasn't changed
        // (though in Next.js layout, this component might mount once, but pathname/params change triggers effect)
        if (lastTrackedPath.current === currentPath) return;

        // We allow tracking again if the search params changed significantly or if it's a new navigation
        // But for simple "Page Views", we usually ignore query params unless it's a search page.
        // Let's stick to unique page views per navigation event.

        // Function to detect device type
        const getDeviceType = () => {
            const ua = navigator.userAgent;
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                return "Tablet";
            }
            if (
                /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
                    ua
                )
            ) {
                return "Mobile";
            }
            return "Desktop";
        };

        // Function to send data
        const trackPageView = async () => {
            // Rough country detection via timezone (client-side heuristic) or just 'Unknown'
            // Ideally we'd use a free IP API, but let's try a simple fetch to a free geoip service if allowed.
            // For speed, let's omit the external fetch for now and rely on "Unknown" or add it later if user wants strict accuracy.
            // USER REQUESTED: "Negara paling banyak". We need this.
            // Let's try to fetch from ipapi.co (free tier) or similar lightweight method.
            // Fallback to 'Unknown' if it fails/blocks.

            let country = "Unknown";
            try {
                // Very simplistic fetch, might fail with adblockers.
                // We'll proceed without waiting too long.
                const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(2000) });
                if (res.ok) {
                    const data = await res.json();
                    country = data.country_name || "Unknown";
                }
            } catch (e) {
                // console.log("Geo fetch failed", e);
            }

            try {
                await fetch("/api/analytics/track", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        page_path: currentPath,
                        referrer: document.referrer || "Direct",
                        device_type: getDeviceType(),
                        country: country,
                        event_type: "pageview",
                    }),
                });
                lastTrackedPath.current = currentPath;
            } catch (error) {
                console.error("Analytics Error:", error);
            }
        };

        // Small delay to ensure not a rapid redirect
        const timeout = setTimeout(trackPageView, 500);

        return () => clearTimeout(timeout);
    }, [pathname, searchParams]);

    return null;
}
