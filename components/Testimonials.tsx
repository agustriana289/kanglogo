// components/Testimonials.tsx
"use client";

import { useState, useEffect } from "react";
import { Testimonial, getAverageRating } from "@/types/testimonial";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import LogoPathAnimation from "./LogoPathAnimation";

// Star rating display component
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className={`w-4 h-4 ${
          star <= rating ? "text-yellow-400" : "text-gray-300"
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("*")
          .not("submitted_at", "is", null)
          .order("created_at", { ascending: false })
          .limit(6); // Hanya tampilkan 6 testimoni di homepage

        if (error) throw error;
        setTestimonials(data || []);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  if (loading) {
    return (
      <section className="py-12 sm:py-24" id="testi">
        <div className="mx-auto max-w-7xl text-center">
          <LogoPathAnimation />
          <p className="mt-4 text-slate-600">Memuat testimoni...</p>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null; // Sembunyikan jika tidak ada testimoni
  }

  return (
    <section className="py-12 sm:py-24" id="testi">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center pb-12">
          <h2 className="max-w-2xl mx-auto font-manrope font-bold text-3xl text-slate-700 sm:mb-5 md:text-5xl leading-tight">
            <span className="text-primary">Testimoni</span> Klien Kami
          </h2>
          <p className="sm:max-w-2xl sm:mx-auto text-base font-normal leading-7 text-slate-600 mb-6">
            Berikut pendapat klien kami setelah merasakan layanan dari
            KangLogo.com
          </p>
        </div>

        {/* Grid Testimoni */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6"
            >
              {/* Header: Rating */}
              <div className="flex items-center justify-between mb-4">
                <StarRating
                  rating={Math.round(getAverageRating(testimonial))}
                />
                {testimonial.is_featured && (
                  <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Unggulan
                  </span>
                )}
              </div>

              {/* Review Text */}
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-4 mb-4">
                &quot;{testimonial.review_text}&quot;
              </p>

              {/* Footer: Customer Info */}
              <div className="pt-4 border-t border-gray-100">
                <p className="font-semibold text-gray-900">
                  {testimonial.customer_name || "Pelanggan"}
                </p>
                <p className="text-xs text-primary">
                  {testimonial.service_name && testimonial.package_details?.name
                    ? `${testimonial.service_name} (${testimonial.package_details.name})`
                    : testimonial.service_name ||
                      testimonial.package_details?.name ||
                      testimonial.product_name ||
                      "Layanan KangLogo"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Link ke halaman semua testimoni */}
        <div className="text-center mt-10">
          <Link
            href="/testimonials"
            className="inline-flex items-center justify-center py-2.5 px-6 text-base font-semibold text-center text-white rounded-full bg-primary shadow-sm hover:bg-primary/80 transition-all duration-500"
          >
            Lihat Semua Testimoni
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
