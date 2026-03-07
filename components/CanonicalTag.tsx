"use client";

import { useEffect } from "react";

interface CanonicalTagProps {
    url: string;
}

export default function CanonicalTag({ url }: CanonicalTagProps) {
    useEffect(() => {
        const existingCanonical = document.querySelector('link[rel="canonical"]');

        if (existingCanonical) {
            existingCanonical.setAttribute("href", url);
        } else {
            const link = document.createElement("link");
            link.rel = "canonical";
            link.href = url;
            document.head.appendChild(link);
        }

        return () => {
            const canonical = document.querySelector('link[rel="canonical"]');
            if (canonical && canonical.getAttribute("href") === url) {
                canonical.remove();
            }
        };
    }, [url]);

    return null;
}
