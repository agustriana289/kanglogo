// app/admin/generator/page.tsx
import { Metadata } from "next";
import BrandIndustryManager from "@/components/BrandIndustryManager";

export const metadata: Metadata = {
  title: "Kelola Generator Nama Brand | Admin",
  description: "Kelola industri dan keywords untuk brand name generator",
};

export default function AdminGeneratorPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="py-12 px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-700 mb-2">
              Kelola <span className="text-primary">Generator Nama Brand</span>
            </h1>
            <p className="text-slate-600">
              Tambahkan industri baru dan kelola keywords untuk generator nama
              brand.
            </p>
          </div>

          <BrandIndustryManager />
        </div>
      </div>
    </main>
  );
}
