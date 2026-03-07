import { ArrowRight } from "lucide-react";
import FadeIn from "./FadeIn";

export default function CTA({ settings }: { settings?: any }) {
  return (
    <section className="bg-white py-16 sm:py-24" id="cta">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100}>
          <div className="relative isolate overflow-hidden bg-slate-900 px-6 py-24 text-center shadow-2xl rounded-3xl sm:px-16">
            <h2 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {settings?.cta_title || "Ready to elevate your brand?"}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
              {settings?.cta_description || "Join thousands of successful businesses who trust us with their visual identity. Start your project today and get your initial concepts in as little as 24 hours."}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <a
                href="#"
                className="group flex items-center justify-center gap-2 rounded-full bg-indigo-500 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1 w-full sm:w-auto"
              >
                {settings?.cta_button1_text || "Let's get started"}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </a>
              <a href="#" className="flex items-center justify-center gap-2 text-base font-semibold leading-6 text-white transition-colors hover:text-indigo-300 w-full sm:w-auto py-2">
                {settings?.cta_button2_text || "Talk to our team"}
              </a>
            </div>
            
            {/* Background decoration */}
            <svg
              viewBox="0 0 1024 1024"
              className="absolute left-1/2 top-1/2 -z-10 h-256 w-5xl -translate-x-1/2 mask-[radial-gradient(closest-side,white,transparent)]"
              aria-hidden="true"
            >
              <circle cx={512} cy={512} r={512} fill="url(#gradient)" fillOpacity="0.7" />
              <defs>
                <radialGradient id="gradient">
                  <stop stopColor="#818cf8" />
                  <stop offset={1} stopColor="#4338ca" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
