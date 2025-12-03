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

// Generate metadata dinamis dari Supabase
export async function generateMetadata(): Promise<Metadata> {
  const { data: settings } = await supabase
    .from("website_settings")
    .select("website_name,website_description,favicon_url")
    .single();

  const { data: metaTags } = await supabase
    .from("meta_tags")
    .select("*")
    .order("created_at", { ascending: true });

  const metadata: Metadata = {
    title: settings?.website_name || "",
    description: settings?.website_description || "",
    icons: {
      icon: settings?.favicon_url || "",
    },
  };

  // Tambah meta tags dari database
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <script
          src="https://www.google.com/recaptcha/api.js"
          async
          defer
        ></script>
        <link rel="icon" href="/favicon.ico" />
      </head>
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
