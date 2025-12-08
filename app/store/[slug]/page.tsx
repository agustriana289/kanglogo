import { notFound } from "next/navigation";
import { headers } from "next/headers"; // Tambahkan import ini
import { supabase } from "@/lib/supabase";
import { MarketplaceAsset } from "@/types/marketplace";

import Image from "next/image";
import {
  StarIcon,
  GiftIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  TagIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import WidgetArea from "@/components/WidgetArea";
import AssetActions from "./AssetActions";

import ShareButtons from "./ShareButtons";

export const revalidate = 0;

async function getAsset(slug: string): Promise<MarketplaceAsset> {
  const { data, error } = await supabase
    .from("marketplace_assets")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    notFound();
  }

  return data;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Fungsi kecil untuk mengubah newline menjadi <br />
const formatMultiLine = (text: string | null | undefined) => {
  if (!text) return null;
  return text.split("\n").map((line, index) => (
    <span key={index}>
      {line}
      {index < text.split("\n").length - 1 && <br />}
    </span>
  ));
};

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const asset = await getAsset(slug);

  // --- TAMBAHKAN BAGIAN INI ---
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const url = `https://${host}/store/${slug}`;
  // --- AKHIR TAMBAHAN ---

  return (
    <section className="py-16 bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <WidgetArea position="marketplace_header" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Kolom Kiri: Gambar */}
          <div className="relative w-full h-80 lg:h-full lg:min-h-[600px] rounded-2xl overflow-hidden shadow-xl">
            {asset.image_url ? (
              <Image
                src={asset.image_url}
                alt={asset.nama_aset}
                fill
                style={{ objectFit: "cover" }}
                priority
                unoptimized
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500">
                Tidak Ada Gambar
              </div>
            )}
          </div>

          {/* Kolom Kanan: Detail Aset */}
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <h1 className="font-manrope font-bold text-3xl text-slate-700 md:text-4xl leading-[50px]">
                {asset.nama_aset}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${asset.jenis === "premium"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
                  }`}
              >
                {asset.jenis === "premium" ? (
                  <StarIcon className="h-4 w-4 mr-1" />
                ) : (
                  <GiftIcon className="h-4 w-4 mr-1" />
                )}
                {asset.jenis === "premium" ? "Premium" : "Freebies"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-slate-400 mr-2" />
                {asset.jenis === "premium" ? (
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(asset.harga_aset)}
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-green-600">
                    Gratis
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 text-slate-400 mr-2" />
                <span className="text-slate-600">{asset.jenis_lisensi}</span>
              </div>
            </div>

            <div className="flex items-center">
              <TagIcon className="h-5 w-5 text-slate-400 mr-2" />
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {asset.kategori_aset}
              </span>
            </div>

            {asset.deskripsi && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Deskripsi
                </h3>
                <div
                  className="prose prose-sm text-slate-600 max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: asset.deskripsi.replace(/\n/g, "<br>"),
                  }}
                />
              </div>
            )}

            {asset.tagline && (
              <p className="text-sm text-slate-600 italic">{asset.tagline}</p>
            )}

            <AssetActions asset={asset} />

            {/* --- PERUBAHAN KRUSIAL ADA DI SINI --- */}
            <ShareButtons title={asset.nama_aset} url={url} />
            {/* --- AKHIR PERUBAHAN --- */}
          </div>
        </div>
        <WidgetArea position="marketplace_footer" />
      </div>
    </section>
  );
}
