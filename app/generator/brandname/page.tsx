// app/generator/brandname/page.tsx
import { Metadata } from "next";
import BrandNameGeneratorForm from "@/components/BrandNameGeneratorForm";

export const metadata: Metadata = {
  title: "Generator Nama Brand | KangLogo.com",
  description:
    "Buat nama brand unik dan berkesan dengan generator nama brand kami. Kombinasi kata-kata terbaik untuk bisnis Anda.",
};

export default function GeneratorPage() {
  return (
    <section className="py-12 sm:py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="pb-16 text-center">
          <h1 className="max-w-3xl mx-auto font-manrope font-bold text-4xl text-slate-700 mb-5 md:text-6xl leading-tight">
            Generator <span className="text-primary">Nama Brand</span>
          </h1>
          <p className="sm:max-w-2xl sm:mx-auto text-base font-normal leading-7 text-slate-700">
            Ciptakan nama brand unik dan berkesan dengan kombinasi kata-kata terbaik untuk bisnis Anda. Gunakan AI untuk menghasilkan ratusan ide nama dalam sekejap.
          </p>
        </div>

        <BrandNameGeneratorForm />
      </div>
    </section>
  );
}
