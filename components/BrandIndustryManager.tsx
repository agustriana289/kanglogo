// components/BrandIndustryManager.tsx
"use client";

import { useState, useEffect } from "react";
import { BrandIndustry, BrandKeyword } from "@/types/brand-name-generator";
import LogoPathAnimation from "./LogoPathAnimation";
import BrandKeywordBulkUpload from "./BrandKeywordBulkUpload";

export default function BrandIndustryManager() {
  const [industries, setIndustries] = useState<BrandIndustry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [newIndustryName, setNewIndustryName] = useState("");
  const [newIndustryDesc, setNewIndustryDesc] = useState("");

  const [selectedIndustry, setSelectedIndustry] = useState<BrandIndustry | null>(
    null
  );
  const [keywords, setKeywords] = useState<BrandKeyword[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loadingKeywords, setLoadingKeywords] = useState(false);

  // Fetch industries
  const fetchIndustries = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/branding/industries");
      const { data } = await res.json();
      setIndustries(data);
      setError("");
    } catch (err) {
      console.error("Error fetching industries:", err);
      setError("Gagal memuat industri");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  // Fetch keywords untuk industry yang dipilih
  const fetchKeywords = async (industryId: string) => {
    try {
      setLoadingKeywords(true);
      const res = await fetch(`/api/branding/keywords?industryId=${industryId}`);
      const { data } = await res.json();
      setKeywords(data);
    } catch (err) {
      console.error("Error fetching keywords:", err);
      setError("Gagal memuat keywords");
    } finally {
      setLoadingKeywords(false);
    }
  };

  // Tambah industri baru
  const handleAddIndustry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndustryName.trim()) {
      setError("Nama industri tidak boleh kosong");
      return;
    }

    try {
      const res = await fetch("/api/branding/industries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newIndustryName,
          description: newIndustryDesc,
        }),
      });

      if (!res.ok) throw new Error("Gagal menambah industri");

      setNewIndustryName("");
      setNewIndustryDesc("");
      setSuccess("Industri berhasil ditambahkan");
      await fetchIndustries();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error adding industry:", err);
      setError("Gagal menambah industri");
    }
  };

  // Hapus industri
  const handleDeleteIndustry = async (id: string) => {
    if (!confirm("Yakin ingin menghapus industri ini beserta semua keywords?")) {
      return;
    }

    try {
      const res = await fetch(`/api/branding/industries/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus industri");

      if (selectedIndustry?.id === id) {
        setSelectedIndustry(null);
        setKeywords([]);
      }

      setSuccess("Industri berhasil dihapus");
      await fetchIndustries();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting industry:", err);
      setError("Gagal menghapus industri");
    }
  };

  // Pilih industri
  const handleSelectIndustry = async (industry: BrandIndustry) => {
    setSelectedIndustry(industry);
    await fetchKeywords(industry.id);
  };

  // Tambah keyword
  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndustry) {
      setError("Pilih industri terlebih dahulu");
      return;
    }

    if (!newKeyword.trim()) {
      setError("Keyword tidak boleh kosong");
      return;
    }

    try {
      const res = await fetch("/api/branding/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry_id: selectedIndustry.id,
          keyword: newKeyword,
        }),
      });

      if (!res.ok) throw new Error("Gagal menambah keyword");

      setNewKeyword("");
      setSuccess("Keyword berhasil ditambahkan");
      await fetchKeywords(selectedIndustry.id);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error adding keyword:", err);
      setError("Gagal menambah keyword");
    }
  };

  // Hapus keyword
  const handleDeleteKeyword = async (keywordId: string) => {
    if (!confirm("Yakin ingin menghapus keyword ini?")) {
      return;
    }

    try {
      const res = await fetch(`/api/branding/keywords/${keywordId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus keyword");

      setSuccess("Keyword berhasil dihapus");
      if (selectedIndustry) {
        await fetchKeywords(selectedIndustry.id);
      }

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting keyword:", err);
      setError("Gagal menghapus keyword");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <LogoPathAnimation />
        <p className="text-slate-600">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Success & Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bagian 1: Tambah Industri Baru */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-700 mb-4">
            Tambah Industri Baru
          </h3>
          <form onSubmit={handleAddIndustry} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nama Industri
              </label>
              <input
                type="text"
                value={newIndustryName}
                onChange={(e) => setNewIndustryName(e.target.value)}
                placeholder="Contoh: Teknologi, Fashion, Makanan..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Deskripsi (Opsional)
              </label>
              <textarea
                value={newIndustryDesc}
                onChange={(e) => setNewIndustryDesc(e.target.value)}
                placeholder="Deskripsi singkat industri..."
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Tambah Industri
            </button>
          </form>
        </div>

        {/* Bagian 2: Daftar Industri */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-700 mb-4">
            Daftar Industri ({industries.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {industries.map((industry) => (
              <div
                key={industry.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedIndustry?.id === industry.id
                    ? "bg-primary/10 border-primary"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div
                    onClick={() => handleSelectIndustry(industry)}
                    className="flex-1"
                  >
                    <p className="font-semibold text-slate-700">{industry.name}</p>
                    {industry.description && (
                      <p className="text-sm text-slate-500 mt-1">
                        {industry.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteIndustry(industry.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-semibold"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bagian 3: Kelola Keywords */}
      {selectedIndustry && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-700 mb-4">
            Kelola Keywords - <span className="text-primary">{selectedIndustry.name}</span>
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Tambah Keyword */}
            <div className="lg:col-span-1">
              <form onSubmit={handleAddKeyword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Keyword Baru
                  </label>
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Masukkan keyword..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Tambah Keyword
                  </button>
                  <BrandKeywordBulkUpload
                    selectedIndustry={selectedIndustry}
                    onSuccess={() => {
                      if (selectedIndustry) {
                        fetchKeywords(selectedIndustry.id);
                      }
                    }}
                  />
                </div>
              </form>
            </div>

            {/* Daftar Keywords */}
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold text-slate-600 mb-3">
                Total Keywords: {keywords.length}
              </p>
              <div className="flex flex-wrap gap-2">
                {loadingKeywords ? (
                  <p className="text-slate-500">Memuat keywords...</p>
                ) : keywords.length > 0 ? (
                  keywords.map((keyword) => (
                    <div
                      key={keyword.id}
                      className="bg-slate-100 px-4 py-2 rounded-full flex items-center gap-2 group"
                    >
                      <span className="text-slate-700">{keyword.keyword}</span>
                      <button
                        onClick={() => handleDeleteKeyword(keyword.id)}
                        className="text-slate-400 hover:text-red-600 group-hover:opacity-100 opacity-0 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">
                    Belum ada keyword. Tambahkan keyword untuk industri ini.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
