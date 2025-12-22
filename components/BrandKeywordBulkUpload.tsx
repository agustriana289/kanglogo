// components/BrandKeywordBulkUpload.tsx
"use client";

import { useState } from "react";
import { BrandIndustry } from "@/types/brand-name-generator";

interface BrandKeywordBulkUploadProps {
  selectedIndustry: BrandIndustry | null;
  onSuccess: () => void;
}

export default function BrandKeywordBulkUpload({
  selectedIndustry,
  onSuccess,
}: BrandKeywordBulkUploadProps) {
  const [showModal, setShowModal] = useState(false);
  const [bulkKeywords, setBulkKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleBulkAdd = async () => {
    if (!selectedIndustry) {
      setError("Pilih industri terlebih dahulu");
      return;
    }

    if (!bulkKeywords.trim()) {
      setError("Masukkan minimal satu keyword");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Split berdasarkan newline, comma, atau semicolon
      const keywords = bulkKeywords
        .split(/[\n,;]/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      if (keywords.length === 0) {
        setError("Tidak ada keyword yang valid");
        setLoading(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      // Add keywords satu per satu (API constraint handling)
      for (const keyword of keywords) {
        try {
          const res = await fetch("/api/branding/keywords", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              industry_id: selectedIndustry.id,
              keyword,
            }),
          });

          if (res.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;
        }
      }

      if (successCount > 0) {
        setSuccess(
          `${successCount} keyword berhasil ditambahkan${
            failCount > 0 ? `, ${failCount} gagal` : ""
          }`
        );
        setBulkKeywords("");
        setTimeout(() => {
          setShowModal(false);
          onSuccess();
        }, 1500);
      } else {
        setError("Gagal menambahkan keywords");
      }
    } catch (err) {
      console.error("Error bulk adding keywords:", err);
      setError("Terjadi kesalahan saat menambahkan keywords");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition-colors text-sm"
      >
        + Bulk Add Keywords
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-700 mb-4">
              Bulk Add Keywords
            </h3>

            {selectedIndustry && (
              <p className="text-sm text-slate-600 mb-4">
                Untuk industri:{" "}
                <span className="font-semibold">{selectedIndustry.name}</span>
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Masukkan Keywords
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Pisahkan dengan newline, koma, atau semicolon
                </p>
                <textarea
                  value={bulkKeywords}
                  onChange={(e) => setBulkKeywords(e.target.value)}
                  placeholder="Tech, Soft, Code, Data&#10;Cloud, Smart, Digital&#10;Net, Web, App"
                  rows={5}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleBulkAdd}
                  disabled={loading}
                  className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Menambahkan..." : "Tambahkan"}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setBulkKeywords("");
                    setError("");
                  }}
                  disabled={loading}
                  className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-semibold hover:bg-slate-300 disabled:opacity-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
