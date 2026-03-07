"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";
import FadeIn from "./FadeIn";

export default function PortfolioGallery({ settings, portfolios = [] }: { settings?: any, portfolios?: any[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedImage]);

  return (
    <>
      <section className="bg-slate-50 py-24 sm:py-32" id="portfolio">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn delay={100} className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 mb-4">
              <span>{settings?.portfolio_badge || "View Our Work"}</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {settings?.portfolio_title || "Recent Masterpieces"}
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              {settings?.portfolio_description || "A glimpse into the visual identities we've crafted for brands around the globe. Click any image to view details."}
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((item, idx) => {
              const imageUrl = item.images?.[0] || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&q=80&auto=format&fit=crop";
              return (
              <FadeIn key={item.id} delay={100 + (idx % 3) * 150}>
                <div 
                  className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:shadow-xl hover:ring-indigo-200 hover:-translate-y-1"
                  onClick={() => setSelectedImage(imageUrl)}
                >
                  <div className="aspect-4/3 w-full overflow-hidden bg-slate-100 relative">
                    {/* Placeholder colored fallback while image loads */}
                    <div className="absolute inset-0 bg-linear-to-br from-indigo-50 to-purple-50 animate-pulse -z-10" />
                    
                    {/* Optimized Next.js Image Component */}
                    <Image
                      src={imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
                      <div className="transform translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 flex items-center justify-center h-14 w-14 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-lg">
                        <ZoomIn size={24} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mt-1 line-clamp-1">
                      {item.category || "Uncategorized"}
                    </p>
                  </div>
                </div>
              </FadeIn>
            )})}
          </div>
        </div>
      </section>

      {/* Lightbox / Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/90 backdrop-blur-md transition-opacity" 
          onClick={() => setSelectedImage(null)}
          aria-modal="true"
          role="dialog"
        >
          <button 
            className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white/70 hover:text-white transition-all bg-white/10 hover:bg-white/20 hover:scale-110 rounded-full p-3 backdrop-blur-md z-10"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
          
          <div 
            className="relative w-full max-w-5xl h-[70vh] sm:h-[90vh] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <Image 
              src={selectedImage} 
              alt="Zoomed portfolio view" 
              fill
              className="object-contain rounded-2xl bg-black/50"
            />
          </div>
        </div>
      )}
    </>
  );
}
