"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import FAQSidebar from "./FAQSidebar";
import Link from "next/link";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  featured: boolean;
}

interface PublicFAQProps {
  serviceTitle?: string;
}

const ITEMS_PER_PAGE = 10;

export default function PublicFAQ({ serviceTitle }: PublicFAQProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Umum");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchFAQs();
  }, [serviceTitle, selectedCategory]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("faqs")
        .select("*")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: true });

      // Filter berdasarkan kategori yang dipilih
      if (selectedCategory !== "Semua") {
        query = query.ilike("category", `%${selectedCategory}%`);
      }

      // Jika ada serviceTitle (dari halaman layanan), override dengan itu
      if (serviceTitle) {
        query = supabase
          .from("faqs")
          .select("*")
          .ilike("category", `%${serviceTitle}%`)
          .order("featured", { ascending: false })
          .order("created_at", { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching FAQs:", error);
        setFaqs([]);
      } else {
        setFaqs(data || []);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(faqs.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = faqs.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Beranda
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            <span className="text-primary">Pertanyaan</span> yang Sering Diajukan
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Temukan jawaban untuk pertanyaan umum tentang layanan kami
          </p>
        </div>

        {/* Main Content and Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - FAQ List */}
          <div className="lg:col-span-2">
            {currentItems.length > 0 ? (
              <>
                {/* FAQ Grid */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    {currentItems.map((faq) => (
                      <dl key={faq.id}>
                        <dt className="font-semibold text-gray-900 text-base mb-2">
                          {faq.question}
                        </dt>
                        <dd className="mt-2">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </dd>
                      </dl>
                    ))}
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav aria-label="Page navigation" className="flex justify-center mt-6">
                    <ul className="flex -space-x-px text-sm">
                      {/* Previous Button */}
                      <li>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="flex items-center justify-center text-gray-600 bg-white box-border border border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-s-lg text-sm px-3 h-10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                      </li>

                      {/* Page Numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <li key={page}>
                          <button
                            onClick={() => setCurrentPage(page)}
                            aria-current={currentPage === page ? "page" : undefined}
                            className={`flex items-center justify-center box-border border font-medium text-sm w-10 h-10 focus:outline-none transition-colors ${currentPage === page
                              ? "text-primary bg-gray-100 border-gray-200 hover:text-primary"
                              : "text-gray-600 bg-white border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                          >
                            {page}
                          </button>
                        </li>
                      ))}

                      {/* Next Button */}
                      <li>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="flex items-center justify-center text-gray-600 bg-white box-border border border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-e-lg text-sm px-3 h-10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada FAQ yang ditemukan</h3>
                <p className="text-gray-500">FAQ untuk kategori ini belum tersedia</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <FAQSidebar
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
