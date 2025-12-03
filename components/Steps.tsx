// components/Steps.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Steps() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data } = await supabase.from('landing_page_content').select('*').eq('section', 'steps');
      const grouped = data?.reduce((acc: any, item: any) => { acc[item.key_name] = item.value; return acc; }, {});
      setContent(grouped || {});
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (loading) return <section className="py-12 px-4 sm:px-0" id="step"><div className="flex justify-center h-20"><div className="animate-spin rounded-full h-8 w-8 border border-primary"></div></div></section>;

  return (
    <section className="py-12 px-4 sm:px-0" id="step">
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl">
        <div className="flex flex-wrap -mx-4">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="w-full sm:w-1/2 md:w-1/4">
              <div className="flex items-center p-4 rounded-lg">
                <svg className="size-10 w-1/5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span className="w-4/5">
                  <span className="ml-4 text-base font-semibold text-slate-700">{content[`step${num}_title`]}</span><br />
                  <span className="ml-4 text-xs text-slate-700">{content[`step${num}_desc`]}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}