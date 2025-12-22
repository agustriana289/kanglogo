// components/BrandNameGeneratorForm.tsx
"use client";

import { useState, useEffect } from "react";
import { BrandIndustry, GeneratedResult } from "@/types/brand-name-generator";
import LogoPathAnimation from "./LogoPathAnimation";

const PREFIX_OPTIONS = ["", "PT", "CV", "TOKO", "STUDIO", "AGENCY"];

export default function BrandNameGeneratorForm() {
  const [industries, setIndustries] = useState<BrandIndustry[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [inputText, setInputText] = useState("");
  const [prefix, setPrefix] = useState("");
  const [wordLength, setWordLength] = useState<2 | 3>(2);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingIndustries, setLoadingIndustries] = useState(true);
  const [error, setError] = useState("");

  // Fetch industries saat component mount
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const res = await fetch("/api/branding/industries");
        const { data } = await res.json();
        setIndustries(data);
        if (data.length > 0) {
          setSelectedIndustry(data[0].id);
        }
      } catch (err) {
        console.error("Error fetching industries:", err);
        setError("Gagal memuat industri");
      } finally {
        setLoadingIndustries(false);
      }
    };

    fetchIndustries();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults([]);

    if (!selectedIndustry) {
      setError("Pilih industri terlebih dahulu");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/branding/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industryId: selectedIndustry,
          inputText,
          prefix: prefix || undefined,
          wordLength,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Gagal generate nama");
        return;
      }

      setResults(result.data);
    } catch (err) {
      console.error("Error generating names:", err);
      setError("Terjadi kesalahan saat generate nama");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Bisa tambahkan toast notification di sini
  };

  if (loadingIndustries) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <LogoPathAnimation />
        <p className="text-slate-600">Memuat industri...</p>
      </div>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-700 mb-4">
            Generator <span className="text-primary">Nama Brand</span>
          </h2>
          <p className="text-slate-600">
            Buat kombinasi nama brand yang unik dengan memilih industri dan opsi
            yang tersedia.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Pilih Industri */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Industri
            </label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">-- Pilih Industri --</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
          </div>

          {/* Input Text (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Masukkan Teks (Opsional)
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Masukkan teks yang ingin digunakan..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Prefix */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Prefix Tambahan
            </label>
            <select
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Tanpa Prefix</option>
              {PREFIX_OPTIONS.filter((p) => p !== "").map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Panjang Kata */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Panjang Kata
            </label>
            <div className="flex gap-4">
              {[2, 3].map((length) => (
                <label key={length} className="flex items-center">
                  <input
                    type="radio"
                    value={length}
                    checked={wordLength === length}
                    onChange={(e) =>
                      setWordLength(parseInt(e.target.value) as 2 | 3)
                    }
                    className="mr-2"
                  />
                  <span className="text-slate-700">{length} Kata</span>
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Sedang Generate..." : "Generate Nama Brand"}
          </button>
        </form>

        {/* Hasil Generate */}
        {results.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-slate-700 mb-6">
              Hasil Generate ({results.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <p className="text-lg font-semibold text-slate-800 mb-2">
                    {result.full_name}
                  </p>
                  <button
                    onClick={() => copyToClipboard(result.full_name)}
                    className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded hover:bg-slate-200 transition-colors"
                  >
                    Salin
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
