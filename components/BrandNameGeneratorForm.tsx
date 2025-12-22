// components/BrandNameGeneratorForm.tsx
"use client";

import { useState, useEffect } from "react";
import { BrandIndustry, GeneratedResult } from "@/types/brand-name-generator";
import LogoPathAnimation from "./LogoPathAnimation";

const PREFIX_OPTIONS = ["", "PT", "CV", "TOKO", "STUDIO", "AGENCY"];
const SEPARATOR_OPTIONS = [
  { value: "", label: "Menyambung (TechCode)" },
  { value: "-", label: "Dengan Dash (Tech-Code)" },
  { value: " ", label: "Dengan Spasi (Tech Code)" },
];

export default function BrandNameGeneratorForm() {
  const [industries, setIndustries] = useState<BrandIndustry[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [inputText, setInputText] = useState("");
  const [prefix, setPrefix] = useState("");
  const [wordLength, setWordLength] = useState<2 | 3>(2);
  const [separator, setSeparator] = useState("");
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingIndustries, setLoadingIndustries] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const itemsPerPage = 12;

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
    setCurrentPage(1);
    setCopiedIndex(null);

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
          separator: separator || undefined,
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

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loadingIndustries) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4 bg-white rounded-3xl shadow-sm">
        <LogoPathAnimation />
        <p className="text-slate-600 font-medium">Memuat industri...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleGenerate} className="bg-white rounded-3xl shadow-sm p-8 mb-12 space-y-6">
        {/* Pilih Industri */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Pilih Industri
          </label>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-slate-50"
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
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Kata/Teks Tambahan <span className="text-slate-500 font-normal">(Opsional)</span>
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Tambahkan kata unik Anda yang akan dikombinasikan dengan keywords industri. Kosongkan untuk menggunakan keywords industri saja.
          </p>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Contoh: Pijar, Nata, Kode"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-slate-50"
          />
        </div>

        {/* Prefix */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Prefix Tambahan
          </label>
          <select
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-slate-50"
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
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Jumlah Kata dalam Nama
          </label>
          <div className="flex gap-6">
            {[2, 3].map((length) => (
              <label key={length} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={length}
                  checked={wordLength === length}
                  onChange={(e) =>
                    setWordLength(parseInt(e.target.value) as 2 | 3)
                  }
                  className="w-4 h-4 text-primary cursor-pointer"
                />
                <span className="text-slate-700 font-medium">{length} Kata</span>
              </label>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Pemisah Kata
          </label>
          <select
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-slate-50"
          >
            {SEPARATOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Sedang Generate..." : "Generate Nama Brand"}
        </button>
      </form>

      {/* Hasil Generate */}
      {results.length > 0 && (
        <div className="mt-12">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-slate-700">
              Hasil Generate <span className="text-primary">({results.length})</span>
            </h3>
            <p className="text-slate-600 mt-2">Pilih nama favorit Anda dan salin</p>
          </div>

          {/* Grid Hasil */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {results
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((result, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index;
                const isCopied = copiedIndex === globalIndex;

                return (
                  <button
                    key={index}
                    onClick={() => copyToClipboard(result.full_name, globalIndex)}
                    className={`p-6 border rounded-3xl transition-all text-left w-full ${isCopied
                        ? 'bg-primary border-primary shadow-lg scale-105'
                        : 'bg-white border-slate-200 hover:shadow-md hover:border-primary/30 hover:scale-102'
                      }`}
                  >
                    <p className={`text-lg font-bold break-words ${isCopied ? 'text-white' : 'text-slate-800'
                      }`}>
                      {result.full_name}
                    </p>
                    {isCopied && (
                      <p className="text-sm text-white/90 mt-2 font-medium">✓ Tersalin!</p>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Pagination */}
          {Math.ceil(results.length / itemsPerPage) > 1 && (
            <div className="flex justify-center gap-2 flex-wrap">
              {Array.from({ length: Math.ceil(results.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === page
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}