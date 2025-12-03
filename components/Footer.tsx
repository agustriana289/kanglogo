"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import WidgetArea from "./WidgetArea";

// Definisikan tipe untuk data yang akan digunakan
interface Settings {
  logo_url?: string;
  website_name?: string;
  website_description?: string;
  website_email?: string;
  website_phone?: string;
  website_author?: string;
}

interface LinkCategory {
  id: number;
  name: string;
  location: string;
  order_index: number;
}

interface Link {
  id: number;
  category_id: number;
  label: string;
  url: string;
  order_index: number;
}

interface SocialMedia {
  id: number;
  url: string;
  icon_svg: string;
  order_index: number;
}

export default function Footer() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [linkCategories, setLinkCategories] = useState<LinkCategory[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([]);
  const pathname = usePathname();

  // Jangan tampilkan footer di halaman admin dan login
  if (pathname.startsWith("/admin") || pathname.startsWith("/login")) {
    return null;
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Fetch pengaturan umum
      const { data: settingsData, error: settingsError } = await supabase
        .from("website_settings")
        .select("*")
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        console.error("Error fetching settings:", settingsError);
      } else if (settingsData) {
        setSettings(settingsData);
      }

      // Fetch link kategori
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("link_categories")
        .select("*")
        .order("order_index", { ascending: true });

      if (categoriesError) {
        console.error("Error fetching link categories:", categoriesError);
      } else {
        setLinkCategories(categoriesData || []);
      }

      // Fetch links
      const { data: linksData, error: linksError } = await supabase
        .from("links")
        .select("*")
        .order("order_index", { ascending: true });

      if (linksError) {
        console.error("Error fetching links:", linksError);
      } else {
        setLinks(linksData || []);
      }

      // Fetch social media
      const { data: socialMediaData, error: socialMediaError } = await supabase
        .from("social_media")
        .select("*")
        .order("order_index", { ascending: true });

      if (socialMediaError) {
        console.error("Error fetching social media:", socialMediaError);
      } else {
        setSocialMedia(socialMediaData || []);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const logoUrl = settings?.logo_url;

  // Perbaikan: Tambahkan tipe eksplisit untuk parameter categoryId
  const getLinksByCategory = (categoryId: number) => {
    return links.filter((link) => link.category_id === categoryId);
  };

  const waLink = `https://wa.me/${
    settings?.website_phone?.replace(/\D/g, "") || ""
  }`;

  // Perbaikan: Tambahkan tipe eksplisit untuk parameter svgString
  const fixSvg = (svgString: string) => {
    // Ganti properti SVG yang tidak valid dengan properti yang valid
    return svgString
      .replace(/stop-color/g, "stopColor")
      .replace(/stop-opacity/g, "stopOpacity")
      .replace(/fill-rule/g, "fillRule")
      .replace(/stroke-linecap/g, "strokeLinecap")
      .replace(/stroke-linejoin/g, "strokeLinejoin")
      .replace(/stroke-width/g, "strokeWidth")
      .replace(/clip-rule/g, "clipRule");
  };

  return (
    <>
      <WidgetArea position="footer" />
      <footer className="w-full bg-cover bg-center bg-[url(https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjN9oQmdsmqogVJbD74a5hDrU0UJQuDbUzcQ2knFTw5YGbJz5R5i6n4FvOmqndZmNhTteIW4USYTDkTRXFEyUcEQWk5ENJbUIFBeuOj5oZqSSB1jnI6M7q7sZajQPzx1fdBQwB5dn7nC_N81UZ-bHBiH95gUgolTjWHegrPaQp6LMV-gSf_pNsUDGf-RE1N/s3125/Bg.webp)]">
        <div className="mx-auto max-w-7xl grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 gap-y-8 md:gap-8 py-10 px-4 sm:px-6 lg:px-8">
          <div className="col-span-full mb-10 lg:col-span-2 lg:mb-0">
            <div className="section" id="foot-logo" data-name="Logo Footer">
              <div className="widget Header" data-version="2" id="Header2">
                <a
                  className="flex justify-center lg:justify-start"
                  href="/"
                  title={
                    settings?.website_name ||
                    "Jasa Logo #1 Indonesia - Kanglogo.com"
                  }
                >
                  <img
                    alt={
                      settings?.website_name ||
                      "Jasa Logo #1 Indonesia - Kanglogo.com"
                    }
                    src={logoUrl}
                    title={
                      settings?.website_name ||
                      "Jasa Logo #1 Indonesia - Kanglogo.com"
                    }
                    loading="lazy"
                    className="lazyload h-12 brightness-0 invert opacity-90"
                  />
                </a>
              </div>
              <div className="widget Text" data-version="1" id="Text3">
                <div className="widget-content">
                  <p className="py-8 text-sm text-white lg:max-w-xs text-center lg:text-left">
                    {settings?.website_description ||
                      "Dipercaya oleh ratusan klien lokal hingga internasional. Punya pertanyaan?"}
                  </p>
                </div>
              </div>
              <div className="widget LinkList" data-version="1" id="LinkList3">
                <div className="widget-content">
                  <a
                    className="py-2.5 px-5 h-9 block w-fit bg-primary rounded-full shadow-sm text-xs text-white mx-auto transition-all duration-500 hover:bg-primary/90 lg:mx-0"
                    href={`mailto:${
                      settings?.website_email || "halo@kanglogo.com"
                    }`}
                  >
                    {settings?.website_email || "halo@kanglogo.com"}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {linkCategories
            .filter((cat) => cat.location === "footer")
            .map((category) => (
              <div
                key={category.id}
                className="section"
                id={`foot-link-${category.id}`}
                data-name={`Link ${category.name}`}
              >
                <div
                  className="widget LinkList lg:mx-auto text-left"
                  data-version="1"
                  id={`LinkList${category.id}`}
                >
                  <h4 className="text-lg text-white font-medium mb-7">
                    {category.name}
                  </h4>
                  <ul className="text-sm transition-all duration-500">
                    {getLinksByCategory(category.id).map((link, idx) => (
                      <li key={idx} className="mb-6">
                        <a
                          className="text-white hover:text-white/80"
                          href={link.url}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

          <div className="section" id="foot-link4" data-name="Link Kontak">
            <div
              className="widget Text lg:mx-auto text-left"
              data-version="1"
              id="Text14"
            >
              <h4 className="text-lg text-white font-medium mb-7">
                Hubungi Kami
              </h4>
              <p className="text-sm text-white leading-6 mb-7">
                Hubungi kami untuk konsultasi & pemesanan.
              </p>
              <a
                className="flex items-center justify-center gap-2 bg-[#25d366] rounded-full py-3 px-6 w-fit lg:mx-0 text-sm text-white font-semibold transition-all duration-500 hover:bg-[#25d366]/80"
                href={waLink}
              >
                <svg
                  className="fill-white w-5 h-5"
                  viewBox="-1.66 0 740.824 740.824"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M630.056 107.658C560.727 38.271 468.525.039 370.294 0 167.891 0 3.16 164.668 3.079 367.072c-.027 64.699 16.883 127.855 49.016 183.523L0 740.824l194.666-51.047c53.634 29.244 114.022 44.656 175.481 44.682h.151c202.382 0 367.128-164.689 367.21-367.094.039-98.088-38.121-190.32-107.452-259.707m-259.758 564.8h-.125c-54.766-.021-108.483-14.729-155.343-42.529l-11.146-6.613-115.516 30.293 30.834-112.592-7.258-11.543c-30.552-48.58-46.689-104.729-46.665-162.379C65.146 198.865 202.065 62 370.419 62c81.521.031 158.154 31.81 215.779 89.482s89.342 134.332 89.311 215.859c-.07 168.242-136.987 305.117-305.211 305.117m167.415-228.514c-9.176-4.591-54.286-26.782-62.697-29.843-8.41-3.061-14.526-4.591-20.644 4.592-6.116 9.182-23.7 29.843-29.054 35.964-5.351 6.122-10.703 6.888-19.879 2.296-9.175-4.591-38.739-14.276-73.786-45.526-27.275-24.32-45.691-54.36-51.043-63.542-5.352-9.183-.569-14.148 4.024-18.72 4.127-4.11 9.175-10.713 13.763-16.07 4.587-5.356 6.116-9.182 9.174-15.303 3.059-6.122 1.53-11.479-.764-16.07-2.294-4.591-20.643-49.739-28.29-68.104-7.447-17.886-15.012-15.466-20.644-15.746-5.346-.266-11.469-.323-17.585-.323-6.117 0-16.057 2.296-24.468 11.478-8.41 9.183-32.112 31.374-32.112 76.521s32.877 88.763 37.465 94.885c4.587 6.122 64.699 98.771 156.741 138.502 21.891 9.45 38.982 15.093 52.307 19.323 21.981 6.979 41.983 5.994 57.793 3.633 17.628-2.633 54.285-22.19 61.932-43.616 7.646-21.426 7.646-39.791 5.352-43.617-2.293-3.826-8.41-6.122-17.585-10.714"
                  />
                </svg>{" "}
                Hubungi Kami
              </a>
            </div>
          </div>
        </div>

        <div className="py-7 px-4 sm:px-0 bg-primary">
          <div className="mx-auto max-w-7xl flex items-center justify-center flex-col lg:justify-between lg:flex-row">
            <span className="text-sm text-white text-center sm:text-left">
              ©
              <a href="/" className="hover:underline">
                {settings?.website_name ||
                  "Jasa Logo #1 Indonesia - Kanglogo.com"}
              </a>{" "}
              2018, All rights reserved{" "}
              {settings?.website_author || "Pt Dualapan Creative Design"}.
            </span>
            <div className="flex mt-4 space-x-4 sm:justify-center lg:mt-0">
              {socialMedia.map((social, idx) => (
                <a
                  key={idx}
                  className="relative w-8 h-8 rounded-full transition-all duration-500 flex justify-center items-center bg-white text-primary"
                  href={social.url}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: fixSvg(social.icon_svg),
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
