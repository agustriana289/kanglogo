// app/layout.tsx
import type { Metadata } from "next";
import "react-quill/dist/quill.snow.css";
import { Inter } from "next/font/google";
import "./globals.css";
import { supabase } from "@/lib/supabase";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RootLayoutClient from "./RootLayoutClient";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  // Ambil metadata dinamis dari Supabase UNTUK KEPERLUAN SEO SAJA
  const { data: settings } = await supabase
    .from("website_settings")
    .select("website_name,website_description,favicon_url")
    .single();

  const { data: metaTags } = await supabase
    .from("meta_tags")
    .select("*")
    .order("created_at", { ascending: true });

  // Metadata utama, gunakan data dinamis dari Supabase
  const metadata: Metadata = {
    title: settings?.website_name || "KangLogo.com Dashboard",
    description:
      settings?.website_description ||
      "Aplikasi Admin Dashboard untuk KangLogo.com",
    icons: {
      icon: settings?.favicon_url || "/icons/icon-192x192.png",
    },

    // --- Metadata PWA yang STATIS ---
    // Ini adalah bagian terpenting. Kita mendefinisikannya secara langsung.
    manifest: "/manifest.json",
    themeColor: "#4559f2",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "KangLogo.com",
    },
    // --- Akhir Metadata PWA Statis ---
  };

  // Tambah meta tags dinamis lainnya dari database
  if (metaTags && metaTags.length > 0) {
    const otherMeta: { [name: string]: string | number | (string | number)[] } =
      {};
    const openGraph: any = {};

    metaTags.forEach((tag) => {
      if (tag.is_verification) {
        otherMeta[tag.name] = tag.content;
      } else if (tag.property) {
        const propertyName = tag.property.replace("og:", "");
        openGraph[propertyName] = tag.content;
      } else if (tag.name) {
        otherMeta[tag.name] = tag.content;
      }
    });

    if (Object.keys(openGraph).length > 0) {
      metadata.openGraph = openGraph;
    }
    if (Object.keys(otherMeta).length > 0) {
      metadata.other = otherMeta;
    }
  }

  return metadata;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${inter.className} font-sans antialiased bg-slate-100 m-0 p-0`}
      >
        <RootLayoutClient />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
