// components/Testimonials.tsx
"use client";

import { useState, useEffect } from "react";
import { Testimonial } from "@/types/testimonial";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestimonial, setSelectedTestimonial] =
    useState<Testimonial | null>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("*")
          .order("created_at", { ascending: false });

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

  // useEffect untuk memuat script pihak ketiga (EmbedSocial)
  useEffect(() => {
    const scriptId = "EmbedSocialHashtagScript";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://embedsocial.com/cdn/ht.js";
      document.head.appendChild(script);
    }
  }, []);

  const openTestiModal = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
  };

  const closeTestiModal = () => {
    setSelectedTestimonial(null);
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-24" id="testi">
        <div className="mx-auto max-w-7xl text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-slate-600">Memuat testimoni...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-24" id="testi">
      <div className="mx-auto max-w-7xl relative">
        <div className="text-center pb-16">
          <h1 className="max-w-2xl mx-auto font-manrope font-bold text-4xl text-slate-700 sm:mb-5 md:text-6xl leading-tight">
            <span className="text-primary">Testimoni</span> Klien Kami
          </h1>
          <p className="sm:max-w-2xl sm:mx-auto text-base font-normal leading-7 text-slate-700 mb-9 px-8">
            Berikut pendapat klien kami setelah merasakan layanan dari
            Kanglogo.com.
          </p>
        </div>

        <div className="relative w-full md:w-[1028px] mx-auto">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="flex-none w-[calc(33.333%-0.75rem)] sm:w-[calc(33.333%-1.33rem)] md:w-[calc(33.333%-1.33rem)] cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => openTestiModal(testimonial)}
              >
                <div className="relative w-full h-48 md:h-64">
                  {testimonial.image_url ? (
                    <Image
                      src={testimonial.image_url}
                      alt={testimonial.alt_text || "Testimoni"}
                      fill
                      style={{ objectFit: "cover" }}
                      className="shadow-lg rounded-xl"
                      sizes="(max-width: 768px) 33vw, (max-width: 1200px) 33vw, 33vw"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgIBAwQDAAAAAAAAAAAAAQIDBBEABRIGEyExQVGB/8QAFAEBAAAAAAAAAAAAAAAAAAAAA//EABcRAAMBAAAAAAAAAAAAAAAAAAACEQH/2gAMAwEAAhEDEEA/ALZV2+5HaIJJKruwjUsd+Byc4zgfQB+tMV+maFSEQVqleFQMKI4lUD7gDAGlKUqZGf/Z"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 rounded-xl">
                      Tidak Ada Gambar
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-6xl text-center mt-12">
          <div
            className="embedsocial-hashtag"
            data-ref="beef8b23ea44a025ed412688a62a37d547eecb4c"
          ></div>
        </div>
      </div>

      {selectedTestimonial && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
          onClick={closeTestiModal}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-4xl w-full h-auto md:h-[80vh]">
            <button
              className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-slate-300 z-10"
              onClick={closeTestiModal}
              aria-label="Tutup modal testimoni"
            >
              &times;
            </button>
            <div className="relative w-full h-full">
              {selectedTestimonial.image_url ? (
                <Image
                  src={selectedTestimonial.image_url}
                  alt={selectedTestimonial.alt_text || "Testimoni"}
                  fill
                  style={{ objectFit: "contain" }}
                  className="rounded-lg shadow-2xl"
                  unoptimized
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgIBAwQDAAAAAAAAAAAAAQIDBBEABRIGEyExQVGB/8QAFAEBAAAAAAAAAAAAAAAAAAAAA//EABcRAAMBAAAAAAAAAAAAAAAAAAACEQH/2gAMAwEAAhEDEEA/ALZV2+5HaIJJKruwjUsd+Byc4zgfQB+tMV+maFSEQVqleFQMKI4lUD7gDAGlKUqZGf/Z"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 rounded-lg">
                  Tidak Ada Gambar
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
