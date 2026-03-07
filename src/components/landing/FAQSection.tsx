import { ChevronDown } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  title?: string;
  badge?: string;
}

export default function FAQSection({ faqs, title = "Frequently Asked Questions", badge = "FAQ" }: FAQSectionProps) {
  if (!faqs || faqs.length === 0) return null;
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 mb-4">
            <span>{badge}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.id}
              className="group bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer px-6 py-5 list-none select-none hover:bg-slate-100 transition-colors">
                <span className="text-sm font-bold text-slate-800">{faq.question}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-5 pt-0">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
