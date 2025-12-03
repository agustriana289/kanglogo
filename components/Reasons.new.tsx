// components/Reasons.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Reasons() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_content')
        .select('*')
        .eq('section', 'reasons');
      
      if (error) {
        console.error('Error fetching reasons content:', error);
      } else {
        const groupedContent = data?.reduce((acc: any, item: any) => {
          acc[item.key_name] = item.value;
          return acc;
        }, {});
        setContent(groupedContent || {});
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-24" id="reason">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-24" id="reason">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-10 lg:mb-16 flex justify-center items-center flex-col gap-x-0 gap-y-6 lg:gap-y-0 lg:flex-row lg:justify-between max-md:max-w-lg max-md:mx-auto">
          <div className="relative w-full text-center lg:text-left lg:w-2/4">
            <h1 className="max-w-2xl mx-auto font-manrope font-bold text-3xl text-slate-700 sm:mb-5 md:text-4xl leading-[50px]">
              {content.reasons_title}
              {content.reasons_subtitle && (
                <span className="text-primary">{content.reasons_subtitle}</span>
              )}
            </h1>
          </div>
        </div>

        {/* Grid Kartu Alasan */}
        <div className="flex justify-center items-center gap-x-5 gap-y-8 lg:gap-y-0 flex-wrap md:flex-wrap lg:flex-nowrap lg:flex-row lg:justify-between lg:gap-x-8">
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className="shadow-sm group relative w-full bg-white rounded-2xl p-4 transition-all duration-500 max-md:max-w-md max-md:mx-auto md:w-2/5 xl:p-7 xl:w-1/4"
            >
              <h4 className="text-xl font-semibold text-primary mb-3 capitalize transition-all duration-500 group-hover:text-primary/80">
                {content[`reason${num}_title`] || ''}
              </h4>
              <p className="text-sm font-normal leading-7 text-slate-700 transition-all duration-500 leading-5 group-hover:text-slate-600">
                {content[`reason${num}_desc`] || ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
