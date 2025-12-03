// components/CountdownTimer.tsx
'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
    targetDate: string | null;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        if (!targetDate) return;

        const intervalId = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const difference = target - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft({ days, hours, minutes, seconds });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                clearInterval(intervalId);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [targetDate]);

    if (!targetDate) return null;

    const { days, hours, minutes, seconds } = timeLeft;

    return (
        <div className="text-2xl font-bold text-red-600">
            {days > 0 && <span>{days} Hari </span>}
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
    );
}