"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import FadeIn from "./FadeIn";

const faqs = [
  {
    question: "How long does a typical logo design take?",
    answer: "Our standard delivery time is 3-5 business days for the initial concepts. If you choose our Professional or Enterprise plans, we can deliver your first concepts within 24 to 48 hours.",
  },
  {
    question: "What exactly do I get in the final delivery?",
    answer: "You will receive all industry-standard file formats depending on your tier, including high-resolution PNGs (transparent background), JPGs, and fully scalable, editable vector source files (AI, EPS, SVG) in the Professional and Enterprise plans.",
  },
  {
    question: "Do you offer refunds if I'm not satisfied?",
    answer: "We offer an 'Unlimited Revisions' policy on our Professional and Enterprise tiers, ensuring we keep working until you absolutely love your new brand. Because of the highly custom nature of design work, we typically do not offer full refunds once the initial concepts have been delivered.",
  },
  {
    question: "Who owns the copyright to the logo?",
    answer: "Once the project is complete and full payment is received, you obtain 100% full commercial rights to the final, chosen logo design. It is completely yours to trademark and use anywhere.",
  },
  {
    question: "What is a 'Brand Color Palette' or 'Brand Guidelines'?",
    answer: "These are comprehensive documents that dictate how your brand should look across all mediums. It includes the exact HEX/RGB color codes used in your logo, typography selection, and rules on how to properly display your logo to maintain a consistent identity everywhere.",
  },
];

export default function FAQ({ settings }: { settings?: any }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-slate-50 py-24 sm:py-32" id="faq">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 mb-4">
            <span>{settings?.faq_badge || "Got Questions?"}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {settings?.faq_title || "Frequently asked questions"}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {settings?.faq_description || "If you can't find what you're looking for, feel free to contact our support team."}
          </p>
        </FadeIn>

        <div className="mx-auto max-w-3xl">
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <FadeIn key={index} delay={150 + index * 100}>
                  <div 
                    className={`rounded-2xl transition-all duration-300 ring-1 ${
                      isOpen 
                        ? 'bg-white ring-indigo-100 shadow-md' 
                        : 'bg-white/50 ring-slate-200 hover:ring-indigo-100/50 hover:bg-white'
                    }`}
                  >
                    <button
                      onClick={() => handleToggle(index)}
                      className="flex w-full items-center justify-between px-6 py-5 text-left focus:outline-hidden"
                      aria-expanded={isOpen}
                    >
                      <span className={`text-lg font-semibold transition-colors duration-200 ${isOpen ? 'text-indigo-600' : 'text-slate-900'}`}>
                        {faq.question}
                      </span>
                      <div className={`ml-4 flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 ease-out ${isOpen ? 'rotate-180 bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50/50 group-hover:text-indigo-400'}`}>
                        <ChevronDown size={20} />
                      </div>
                    </button>
                    
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="px-6 pb-6 pt-0 text-slate-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
