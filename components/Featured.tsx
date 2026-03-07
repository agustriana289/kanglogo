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
      className="pt-12 md:pt-24 px-6 py-8 sm:py-12 lg:px-8 relative min-h-[600px]"
      id="featured"
    >

      {/* Konten Utama */}
      <div className="mx-auto max-w-7xl relative z-10 pt-12">
        <div className="text-center mb-12 min-h-[120px]">
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
            <div key={num} className="bg-white rounded-3xl p-6 shadow-sm min-h-[200px]">
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
