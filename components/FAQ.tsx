// components/FAQ.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  featured: boolean;
}

interface FAQProps {
  showFeaturedOnly?: boolean;
}

export default function FAQ({ showFeaturedOnly = false }: FAQProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQs();
  }, [showFeaturedOnly]);

  const fetchFAQs = async () => {
    try {
      let query = supabase
        .from('faqs')
        .select('*')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: true });

      if (showFeaturedOnly) {
        query = query.eq('featured', true).limit(4);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching FAQs:', error);
      } else {
        setFaqs(data || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <section className="pt-12 sm:pt-24" id="faq">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="pb-4">
          <h1 className="text-center max-w-2xl mx-auto font-manrope font-bold text-3xl text-gray-900 sm:mb-5 md:text-5xl leading-[50px]">
            <span className="text-primary">Punya Pertanyaan ?</span> Cek disini
          </h1>
          <p className="sm:max-w-2xl sm:mx-auto text-center text-base font-normal leading-7 text-gray-500 mb-9">
            Sebelum mengajukan pertanyaan, yuk lihat dulu jawaban yang sudah ada.
          </p>
        </div>

        {/* FAQ Items - Static Display sesuai original Anda */}
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 md:gap-y-12">
            {faqs.map((item) => (
              <dl key={item.id}>
                <dt className="font-medium leading-6 text-gray-700 text-lg mt-4">{item.question}</dt>
                <dd className="mt-4">
                  <p className="text-base font-normal leading-7 text-slate-700">{item.answer}</p>
                </dd>
              </dl>
            ))}
          </div>
        </div>

        {/* Link to full FAQ page (only on homepage) */}
        {showFeaturedOnly && (
          <div className="mt-12 text-center">
            <a
              href="/faq"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/80 transition-colors"
            >
              Lihat Semua FAQ
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}