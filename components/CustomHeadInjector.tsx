"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CustomHeadInjector() {
    useEffect(() => {
        const injectCustomCode = async () => {
            try {
                const { data } = await supabase
                    .from('website_settings')
                    .select('custom_head_code')
                    .single();

                if (data?.custom_head_code) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = data.custom_head_code;

                    const scripts = tempDiv.querySelectorAll('script');
                    scripts.forEach((script) => {
                        const newScript = document.createElement('script');

                        if (script.src) {
                            newScript.src = script.src;
                        }

                        if (script.innerHTML) {
                            newScript.innerHTML = script.innerHTML;
                        }

                        Array.from(script.attributes).forEach((attr) => {
                            newScript.setAttribute(attr.name, attr.value);
                        });

                        document.head.appendChild(newScript);
                    });

                    const metas = tempDiv.querySelectorAll('meta');
                    metas.forEach((meta) => {
                        const newMeta = document.createElement('meta');
                        Array.from(meta.attributes).forEach((attr) => {
                            newMeta.setAttribute(attr.name, attr.value);
                        });
                        document.head.appendChild(newMeta);
                    });
                }
            } catch (error) {
                console.error('Error injecting custom head code:', error);
            }
        };

        injectCustomCode();
    }, []);

    return null;
}
