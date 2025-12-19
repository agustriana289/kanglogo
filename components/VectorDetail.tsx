// components/VectorDetail.tsx
"use client";

import { useState } from "react";
import { LogoVector } from "@/types/logoVector";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  ArrowDownTrayIcon,
  TagIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { getGoogleDriveDownloadUrl } from "@/lib/googleDriveUtils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import VectorPreview from "./VectorPreview";
import WidgetArea from "@/components/WidgetArea";

interface VectorDetailProps {
  vector: LogoVector;
}

export default function VectorDetail({ vector }: VectorDetailProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!vector.file_id) return;

    setDownloading(true);
    try {
      // Increment download counter
      await supabase
        .from("logo_vectors")
        .update({ downloads: vector.downloads + 1 })
        .eq("id", vector.id);

      // Download file
      const downloadUrl = getGoogleDriveDownloadUrl(vector.file_id);
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error("Error downloading:", error);
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy", { locale: id });
  };

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-primary">
                Beranda
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/vector" className="text-gray-500 hover:text-primary">
                Logo Vector
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">{vector.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 lg:p-12">
            <div className="bg-gray-50 rounded-lg p-12 flex items-center justify-center min-h-[400px]">
              <VectorPreview
                fileId={vector.file_id}
                name={vector.name}
                svgContent={vector.svg_content}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>

          {/* Right: Info & Download */}
          <div className="space-y-6">
            {/* Widget - Below Preview */}
            <WidgetArea position="vector_top" />

            {/* Title & Category */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {vector.name}
                </h1>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {vector.category}
                </span>
              </div>

              {vector.description && (
                <p className="text-gray-600 leading-relaxed">
                  {vector.description}
                </p>
              )}
            </div>

            {/* Widget - Above Download */}
            <WidgetArea position="vector_middle" />

            {/* Download Button */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <button
                onClick={handleDownload}
                disabled={downloading || !vector.file_id}
                className="w-full bg-primary text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowDownTrayIcon className="h-6 w-6" />
                {downloading ? "Mengunduh..." : "Download Gratis"}
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                File format: SVG • Gratis untuk penggunaan komersial
              </p>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Informasi
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Total Download
                  </span>
                  <span className="font-semibold text-gray-900">
                    {vector.downloads}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <TagIcon className="h-4 w-4" />
                    Kategori
                  </span>
                  <span className="font-semibold text-gray-900">
                    {vector.category}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Ditambahkan
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(vector.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Share or Additional Info */}
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-600">
                💡 <strong>Tip:</strong> File SVG dapat diedit dengan Adobe
                Illustrator, Inkscape, atau editor vector lainnya
              </p>
            </div>

            {/* Widget - Below Tip */}
            <WidgetArea position="vector_bottom" />
          </div>
        </div>

        {/* Back to List */}
        <div className="mt-12 text-center">
          <Link
            href="/vector"
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Kembali ke Daftar Logo Vector
          </Link>
        </div>
      </div>
    </main>
  );
}
