// components/FAQ.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
        .from("faqs")
        .select("*")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: true });

      if (showFeaturedOnly) {
        query = query.eq("featured", true).limit(4);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching FAQs:", error);
      } else {
        setFaqs(data || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      setLoading(false);
    }
  };

  return (
    <section className="pt-12 sm:pt-24" id="faq">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <div className="pb-4">
          <h1 className="text-center max-w-2xl mx-auto font-manrope font-bold text-3xl text-gray-900 sm:mb-5 md:text-5xl leading-[50px]">
            <span className="text-primary">Punya Pertanyaan ?</span> Cek disini
          </h1>
          <p className="sm:max-w-2xl sm:mx-auto text-center text-base font-normal leading-7 text-gray-500 mb-9">
            Sebelum mengajukan pertanyaan, yuk lihat dulu jawaban yang sudah
            ada.
          </p>
        </div>

        {/* FAQ Items - Static Display sesuai original Anda */}
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 md:gap-x-8 md:gap-y-12">
            {faqs.map((item) => (
              <dl key={item.id}>
                <dt className="font-medium leading-6 text-gray-700 text-lg mt-4">
                  {item.question}
                </dt>
                <dd className="mt-4">
                  <p className="text-base font-normal leading-7 text-slate-700">
                    {item.answer}
                  </p>
                </dd>
              </dl>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
