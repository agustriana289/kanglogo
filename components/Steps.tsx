// components/Steps.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Steps() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data } = await supabase
        .from("landing_page_content")
        .select("*")
        .eq("section", "steps");
      const grouped = data?.reduce((acc: any, item: any) => {
        acc[item.key_name] = item.value;
        return acc;
      }, {});
      setContent(grouped || {});
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  if (loading)
    return (
      <section className="py-12 px-4 sm:px-0" id="step">
        <div className="flex justify-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border border-primary"></div>
        </div>
      </section>
    );

  return (
    <section className="py-12 px-4 sm:px-0" id="step">
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl">
        <div className="flex flex-wrap -mx-4">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="w-full sm:w-1/2 md:w-1/4">
              <div className="flex items-center p-4 rounded-lg">
                {content[`step${num}_icon`] ? (
                  <div
                    className="size-10 w-1/5 text-slate-700"
                    dangerouslySetInnerHTML={{
                      __html: content[`step${num}_icon`],
                    }}
                  />
                ) : (
                  // Default icons based on step number
                  <svg
                    className="size-10 w-1/5 text-slate-700"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {num === 1 && (
                      <path
                        d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {num === 2 && (
                      <path
                        d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {num === 3 && (
                      <path
                        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {num === 4 && (
                      <path
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                )}
                <span className="w-4/5">
                  <span className="ml-4 text-base font-semibold text-slate-700">
                    {content[`step${num}_title`]}
                  </span>
                  <br />
                  <span className="ml-4 text-xs text-slate-700">
                    {content[`step${num}_desc`]}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
