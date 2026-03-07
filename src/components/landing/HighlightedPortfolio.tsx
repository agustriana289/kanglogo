"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";
import FadeIn from "./FadeIn";

export default function HighlightedPortfolio({ settings, portfolios = [] }: { settings?: any, portfolios?: any[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedImage]);

  return (
    <>
      <section className="bg-white py-24 sm:py-32" id="highlighted-work">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn delay={100} className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {settings?.case_studies_title || "More Case Studies"}
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              {settings?.case_studies_description || "A curated collection of our finest brand identity projects."}
            </p>
          </FadeIn>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[150px] sm:auto-rows-[200px] md:auto-rows-[250px]">
            {portfolios.slice(0, 13).map((item, idx) => {
              // The first item is large (2 columns wide, 2 rows high on md+ screens)
              const isLarge = idx === 0;
              const imageUrl = item.images?.[0] || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&q=80";
              
              return (
                <div
                  key={item.id}
                  className={`group relative cursor-pointer overflow-hidden rounded-3xl bg-slate-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:ring-2 hover:ring-indigo-400 hover:ring-offset-2 ${
                    isLarge ? "col-span-2 row-span-2" : "col-span-1 row-span-1"
                  }`}
                  onClick={() => setSelectedImage(imageUrl)}
                >
                  <div className="absolute inset-0 bg-linear-to-br from-indigo-50 to-purple-50 animate-pulse -z-10" />
                  
                  {/* Optimized Next.js Image Component */}
                  <Image
                    src={imageUrl}
                    alt={item.title}
                    fill
                    sizes={isLarge ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    priority={isLarge}
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-6">
                    <div className="transform translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="mb-3 inline-block rounded-full bg-white/20 backdrop-blur-md p-2 text-white shadow-lg">
                        <ZoomIn size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{item.title}</h3>
                      <p className="text-sm text-slate-300 font-medium line-clamp-1">{item.category || "Uncategorized"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lightbox / Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-xl transition-opacity" 
          onClick={() => setSelectedImage(null)}
          aria-modal="true"
          role="dialog"
        >
          <button 
            className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white/50 hover:text-white transition-all bg-white/10 hover:bg-white/20 hover:scale-110 rounded-full p-3 backdrop-blur-md z-10"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
          
          <div 
            className="relative w-full max-w-6xl h-[70vh] sm:h-[90vh] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <Image 
              src={selectedImage} 
              alt="Zoomed portfolio view" 
              fill
              className="object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
