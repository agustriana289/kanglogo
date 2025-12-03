'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function RootLayoutClient() {
  useEffect(() => {
    const updateMeta = async () => {
      try {
        const { data } = await supabase
          .from('website_settings')
          .select('website_name,website_description,favicon_url')
          .single();

        if (data) {
          // Update title
          if (data.website_name) {
            document.title = data.website_name;
          }

          // Update meta description
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          if (data.website_description) {
            metaDesc.setAttribute('content', data.website_description);
          }

          // Update favicon
          if (data.favicon_url) {
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
              favicon = document.createElement('link');
              favicon.setAttribute('rel', 'icon');
              document.head.appendChild(favicon);
            }
            favicon.setAttribute('href', data.favicon_url);
          }
        }
      } catch (error) {
        console.error('Error updating meta:', error);
      }
    };

    updateMeta();
  }, []);

  return null;
}
