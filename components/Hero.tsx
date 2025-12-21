"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import LogoPathAnimation from "./LogoPathAnimation";
import NextImage from "next/image";

// Definisikan tipe untuk data yang akan digunakan
interface HeroContent {
  [key: string]: any;
  hero_background?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_description?: string;
  hero_button1_text?: string;
  hero_button1_url?: string;
  hero_button2_text?: string;
  hero_button2_url?: string;
  hero_rating?: string;
  hero_rating_count?: string;
  hero_rating_text?: string;
  client_rating_url?: string;
  hero_image?: string;
  hero_svg?: string;
  [key: `client_image${number}`]: string;
}

interface Review {
  id: number;
  is_active: boolean;
  created_at: string;
  [key: string]: any;
}

export default function Hero() {
  const [content, setContent] = useState<HeroContent>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
    fetchReviews();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("landing_page_content")
        .select("*")
        .eq("section", "hero");

      if (error) {
        console.error("Error fetching hero content:", error);
      } else {
        // Group content by key_name
        const heroContent = data?.reduce((acc, item) => {
          acc[item.key_name] = item.value;
          return acc;
        }, {});

        setContent(heroContent);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("google_reviews")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching reviews:", error);
      } else {
        setReviews(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <LogoPathAnimation />
      </div>
    );
  }

  // Jika tidak ada konten sama sekali, tampilkan pesan
  if (!content || Object.keys(content).length === 0) {
    return (
      <section className="flex pt-12 pb-6 px-6 md:px-20 items-center justify-center bg-primary">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Konten Hero belum diatur</h1>
          <p>Silakan atur konten Hero di halaman Admin Landing Content</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative py-20 px-6 md:px-20 overflow-hidden bg-primary rounded-b-3xl"
      id="hero"
    >
      {/* Background SVG Layer */}
      {/* Background Layer (Image/SVG URL) */}
      <div
        className="absolute inset-0 z-0 bg-no-repeat bg-cover bg-center"
        style={{
          backgroundImage: content.hero_background
            ? `url(${content.hero_background})`
            : "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
        }}
      />

      {/* Overlay untuk memastikan readability dengan dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10 z-0 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col-reverse sm:flex-col gap-6 md:flex-row items-center justify-center max-w-7xl w-full mb-20 mx-auto min-h-[500px]">
        {/* Kolom Kiri: Teks dan Tombol */}
        <div className="w-full md:w-6/12">
          {/* Judul - 3 komponen: title, subtitle dengan warna beda, dan deskripsi */}
          <div className="mb-9">
            {/* Line 1: Title (White) */}
            {content.hero_title && (
              <h1 className="max-w-2xl font-manrope font-bold text-4xl text-white mb-5 md:text-6xl">
                {content.hero_title}
              </h1>
            )}

            {/* Line 2: Subtitle (Yellow) */}
            {content.hero_subtitle && (
              <p className="max-w-2xl text-base font-normal leading-7 text-white mb-9">
                {content.hero_subtitle}
              </p>
            )}
          </div>
          {/* Description - singkat di bawah judul */}
          {content.hero_description && (
            <p className="max-w-2xl text-base font-normal leading-7 text-white mb-9">
              {content.hero_description}
            </p>
          )}

          {/* Tombol-tombol hanya muncul jika ada teksnya */}
          {(content.hero_button1_text || content.hero_button2_text) && (
            <div className="flex flex-col-reverse sm:flex-row gap-4 justify-center md:justify-start">
              {content.hero_button1_text && (
                <a
                  className="inline-flex items-center justify-center py-2.5 px-6 text-base font-semibold text-center text-slate-700 rounded-full bg-secondary shadow hover:bg-secondary/80 transition-all duration-500"
                  href={content.hero_button1_url || "#"}
                >
                  {content.hero_button1_text}
                </a>
              )}
              {content.hero_button2_text && (
                <a
                  className="inline-flex items-center justify-center py-2.5 px-6 text-base font-semibold text-center text-primary rounded-full bg-white shadow hover:bg-white/80 transition-all duration-500"
                  href={content.hero_button2_url || "#"}
                >
                  {content.hero_button2_text}
                </a>
              )}
            </div>
          )}

          {/* Social Proof: Rating dan Foto - hanya muncul jika ada datanya */}
          {(content.hero_rating ||
            content.hero_rating_count ||
            content.hero_rating_text) && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-x-6">
                {/* Client Images - hanya muncul jika ada */}
                {[1, 2, 3, 4, 5].some((num) => content[`client_image${num}`]) && (
                  <div className="hidden sm:flex -space-x-2">
                    {[1, 2, 3, 4, 5].map(
                      (num) =>
                        content[`client_image${num}`] && (
                          <NextImage
                            key={num}
                            className="inline-block rounded-full ring-2 ring-white"
                            src={content[`client_image${num}`]}
                            alt={`Client ${num}`}
                            width={48}
                            height={48}
                            style={{ objectFit: "cover" }}
                            loading="lazy"
                          />
                        )
                    )}
                  </div>
                )}

                {/* Rating - hanya muncul jika ada datanya */}
                {(content.hero_rating ||
                  content.hero_rating_count ||
                  content.hero_rating_text) && (
                    <div className="border-none sm:border-l-2 border-indigo-700 sm:pl-8">
                      <div className="flex items-center text-white">
                        {content.hero_rating && (
                          <h3 className="text-2xl font-semibold mr-2">
                            {content.hero_rating}
                          </h3>
                        )}
                        {/* SVG Ikon Bintang */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          className="size-6"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                          />
                        </svg>
                      </div>
                      {content.hero_rating_text && (
                        <p className="text-sm text-white">
                          {content.hero_rating_text}
                          {content.client_rating_url && (
                            <>
                              {" "}
                              di{" "}
                              <a
                                href={content.client_rating_url}
                                className="hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Google
                              </a>
                              .
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  )}
              </div>
            )}
        </div>

        {/* Kolom Kanan: Gambar atau SVG */}
        <div className="w-full md:w-6/12 flex justify-center md:justify-end">
          {content.hero_svg ? (
            <div
              className="w-full h-auto animate-float"
              dangerouslySetInnerHTML={{ __html: content.hero_svg }}
            />
          ) : content.hero_image ? (
            <NextImage
              className="max-w-full h-auto animate-float"
              src={content.hero_image}
              alt="Hero Image"
              width={400}
              height={400}
              priority
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgIBAwQDAAAAAAAAAAAAAQIDBBEABRIGEyExQVGB/8QAFAEBAAAAAAAAAAAAAAAAAAAAA//EABcRAAMBAAAAAAAAAAAAAAAAAAACEQH/2gAMAwEAAhEDEQA/ALZV2+5HaIJJKruwjUsd+Byc4zgfQB+tMV+maFSEQVqleFQMKI4lUD7gDAGlKUqZGf/Z"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
