"use client";

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';

export default function CustomHeadInjector() {
    const [customCode, setCustomCode] = useState('');

    useEffect(() => {
        const fetchCustomCode = async () => {
            try {
                const { data } = await supabase
                    .from('website_settings')
                    .select('custom_head_code')
                    .single();

                if (data?.custom_head_code) {
                    setCustomCode(data.custom_head_code);
                }
            } catch (error) {
                console.error('Error fetching custom head code:', error);
            }
        };

        fetchCustomCode();
    }, []);

    if (!customCode) return null;

    return (
        <div dangerouslySetInnerHTML={{ __html: customCode }} />
    );
}
