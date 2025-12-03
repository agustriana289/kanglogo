"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  featured: boolean;
}

interface PublicFAQProps {
  // Hanya perlu serviceTitle, kategori default akan ditangani di dalam
  serviceTitle?: string;
}

export default function PublicFAQ({ serviceTitle }: PublicFAQProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQs();
  }, [serviceTitle]); // Efek akan dijalankan ulang jika serviceTitle berubah

  const fetchFAQs = async () => {
    try {
      setLoading(true);

      // Tentukan kategori yang akan difilter.
      // Jika serviceTitle ada (dari halaman layanan), gunakan itu.
      // Jika tidak ada (dari halaman FAQ umum), gunakan 'Umum'.
      const filterCategory = serviceTitle || "Umum";

      console.log("Fetching FAQs for category:", filterCategory);

      // --- PERUBAHAN PENTING DI SINI ---
      // Hanya filter berdasarkan kategori yang dipilih, tanpa menambahkan 'Umum'
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .ilike("category", `%${filterCategory}%`) // Menggunakan ilike untuk pencocokan fleksibel
        .order("featured", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching FAQs:", error);
        setFaqs([]);
      } else {
        setFaqs(data || []);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
            Sebelum mengajukan pertanyaan, yuk lihat dulu jawaban yang sudah
            ada.
          </p>
        </div>

        {/* FAQ Items - Grid Layout Asli */}
        <div className="mt-4 mb-16">
          {faqs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 md:gap-y-12">
              {faqs.map((item) => (
                <dl key={item.id}>
                  <dt className="font-medium leading-6 text-gray-700 text-lg mt-4">
                    {item.question}
                  </dt>
                  <dd className="mt-4">
                    <p className="text-base font-normal leading-7 text-slate-700">
                      {item.answer}
                    </p>
                    {item.category && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    )}
                  </dd>
                </dl>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                  ></path>
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-slate-900">
                Tidak ada faq yang ditemukan
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Faq untuk kategori ini belum tersedia.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
