// components/Video.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Video() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data } = await supabase.from('landing_page_content').select('*').eq('section', 'video');
      const grouped = data?.reduce((acc: any, item: any) => { acc[item.key_name] = item.value; return acc; }, {});
      setContent(grouped || {});
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (loading) return <section className="flex pt-12 pb-6 px-6 md:px-20 items-center justify-center bg-primary" id="video"><div className="animate-spin rounded-full h-8 w-8 border border-white"></div></section>;
  return (
    <section className="flex pt-12 pb-6 px-6 md:px-20 items-center justify-center bg-primary" id="video">
      <div className="flex flex-col-reverse sm:flex-col gap-6 md:flex-row items-center max-w-6xl">
        
        {/* Kolom Kiri: Teks CTA */}
        <div className="w-full md:w-1/2">
          <h1 className="text-left font-manrope font-bold text-4xl text-white mb-5 md:text-5xl leading-[50px]">
            {content.video_title}
          </h1>
          <p className="text-left text-base font-normal leading-7 text-white mb-9">
            {content.video_description}
          </p>
        </div>

        {/* Kolom Kanan: Video YouTube */}
        <div className="w-full md:w-1/2">
          {content.video_url && (
            <iframe
              width="100%"
              height="260"
              src={content.video_url}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="rounded-xl shadow-lg"
            ></iframe>
          )}
        </div>

      </div>
    </section>
  );
}