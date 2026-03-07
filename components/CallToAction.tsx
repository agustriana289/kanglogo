// components/CallToAction.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CallToAction() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      // Fetch Call to Action content
      const { data: ctaData } = await supabase
        .from("landing_page_content")
        .select("*")
        .eq("section", "call_to_action");

      // Fetch Hero content for background
      const { data: heroData } = await supabase
        .from("landing_page_content")
        .select("*")
        .eq("section", "hero")
        .eq("key_name", "hero_background")
        .single();

      const grouped = ctaData?.reduce((acc: any, item: any) => {
        acc[item.key_name] = item.value;
        return acc;
      }, {});

      // Add hero background to content
      if (heroData) {
        grouped.hero_background = heroData.value;
      }

      setContent(grouped || {});
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  if (loading)
    return (
      <section className="bg-primary py-12" id="call">
        <div className="flex justify-center h-16">
          <div className="animate-spin rounded-full h-8 w-8 border border-white"></div>
        </div>
      </section>
    );

  return (
    <section
      className="bg-primary py-12 px-4 sm:px-0 bg-primary overflow-hidden bg-no-repeat bg-cover bg-center"
      style={{
        backgroundImage: content.hero_background
          ? `url(${content.hero_background})`
          : undefined,
      }}
      id="call"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-manrope font-bold text-4xl text-white mb-5 md:text-6xl leading-[50px]">
          {content.cta_title}
        </h2>
        <p className="mt-6 text-base font-normal leading-7 text-white max-w-3xl">
          {content.cta_description}
        </p>
        <div className="mt-10 flex gap-x-3">
          <a className="md:w-auto mb-2 inline-flex items-center justify-center py-3 px-5 text-base font-semibold leading-7 text-slate-700 rounded-full bg-white shadow-xs hover:bg-white/80 transition-all duration-500" href={content.cta_button1_url || '#'}>
            {content.cta_button1_text}
          </a>
          <a className="md:w-auto mb-2 inline-flex items-center justify-center py-3 px-5 text-base font-semibold leading-7 text-slate-700 rounded-full bg-secondary shadow-xs hover:bg-secondary/80 transition-all duration-500" href={content.cta_button2_url || '#'}>
            {content.cta_button2_text}
          </a>
        </div>
      </div>
    </section>
  );
}