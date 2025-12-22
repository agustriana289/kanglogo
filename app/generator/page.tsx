// app/generator/page.tsx
import { Metadata } from "next";
import BrandNameGeneratorForm from "@/components/BrandNameGeneratorForm";

export const metadata: Metadata = {
  title: "Generator Nama Brand | KangLogo.com",
  description:
    "Buat nama brand unik dan berkesan dengan generator nama brand kami. Kombinasi kata-kata terbaik untuk bisnis Anda.",
};

export default function GeneratorPage() {
  return (
    <main className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <div className="pt-20 pb-20">
        <BrandNameGeneratorForm />
      </div>
    </main>
  );
}
