// components/Featured.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Featured() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("landing_page_content")
        .select("*")
        .eq("section", "featured");

      if (error) {
        console.error("Error fetching featured content:", error);
      } else {
        const groupedContent = data?.reduce((acc: any, item: any) => {
          acc[item.key_name] = item.value;
          return acc;
        }, {});
        setContent(groupedContent || {});
      }
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  return (
    <section
      className="pt-12 px-6 py-8 sm:py-12 lg:px-8 relative"
      id="featured"
    >
      {/* Pembatas Bergelombang (Divider) */}
      <div className="divider absolute top-0 left-0 w-full">
        <svg
          className="transform rotate-180 absolute bottom-0 fill-slate-100 h-[90px] md:h-[150px] w-full"
          preserveAspectRatio="none"
          viewBox="0 0 1000 37"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g className="fill-slate-100">
            <path d="M0 0h1000v1.48H0z"></path>
            <path
              d="M0 0h1000v29.896S550 37 500 37 0 29.896 0 29.896V0Z"
              opacity=".2"
            ></path>
            <path
              d="M0 0h1000v22.792S600 37 500 37 0 22.792 0 22.792V0Z"
              opacity=".3"
            ></path>
            <path
              d="M0 0h1000v15.688S650 37 500 37 0 15.688 0 15.688V0Z"
              opacity=".4"
            ></path>
            <path
              d="M0 0h1000v8.584S700 37 500 37 0 8.584 0 8.584V0Z"
              opacity=".5"
            ></path>
            <path d="M0 0v1.48s250 35.52 500 35.52 500-35.52 500-35.52V0H0Z"></path>
          </g>
        </svg>
      </div>

      {/* Konten Utama */}
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-12">
          <h1 className="max-w-2xl mx-auto font-manrope font-bold text-4xl text-slate-700 mb-5 md:text-6xl leading-tight">
            {content.featured_title}
            {content.featured_subtitle && (
              <span className="text-primary ml-2">
                {content.featured_subtitle}
              </span>
            )}
          </h1>
          {content.featured_description && (
            <p className="sm:max-w-2xl sm:mx-auto text-base font-normal leading-7 text-slate-700">
              {content.featured_description}
            </p>
          )}
        </div>

        {/* Grid Kartu Fitur */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-4 py-8 lg:pt-18 lg:pb-24">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-center">
                {content[`featured_icon${num}`] && (
                  <div
                    className="size-16 text-primary"
                    dangerouslySetInnerHTML={{
                      __html: content[`featured_icon${num}`],
                    }}
                  />
                )}
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-primary mb-4">
                  {content[`featured_title${num}`]}
                </h2>
                <p className="text-base font-normal leading-7 text-slate-700">
                  {content[`featured_desc${num}`]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
