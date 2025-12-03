// components/ReCAPTCHA.tsx
'use client';

import { useEffect, useState } from 'react';

interface ReCAPTCHAProps {
    onChange: (token: string | null) => void;
}

export default function ReCAPTCHA({ onChange }: ReCAPTCHAProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Check if reCAPTCHA script is loaded
        const checkInterval = setInterval(() => {
            if (window.grecaptcha) {
                setIsLoaded(true);
                clearInterval(checkInterval);
            }
        }, 100);

        return () => clearInterval(checkInterval);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            // Render reCAPTCHA widget
            const recaptchaElement = document.getElementById('recaptcha-container');
            if (recaptchaElement) {
                // Clear any existing reCAPTCHA
                recaptchaElement.innerHTML = '';

                window.grecaptcha.render(recaptchaElement, {
                    sitekey: '6LfgTB0sAAAAAFuy5M3B4mR29R9N7sRnS68EzwOJ', // Ganti dengan site key baru yang benar
                    callback: onChange,
                    'expired-callback': () => onChange(null),
                });
            }
        }
    }, [isLoaded, onChange]);

    return <div id="recaptcha-container"></div>;
}