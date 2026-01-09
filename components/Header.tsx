"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import WidgetArea from "./WidgetArea";

// Definisikan tipe untuk data yang akan digunakan
interface Settings {
  logo_url?: string;
  website_name?: string;
  website_phone?: string;
}

interface LinkCategory {
  id: number;
  name: string;
  location: string;
  order_index: number;
}

interface HeaderLink {
  id: number;
  category_id: number;
  label: string;
  url: string;
  order_index: number;
}

import Link from "next/link";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [navLinks, setNavLinks] = useState<HeaderLink[]>([]);
  const pathname = usePathname();

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
        .eq("location", "header")
        .order("order_index", { ascending: true });

      if (categoriesError) {
        console.error("Error fetching link categories:", categoriesError);
      } else if (categoriesData && categoriesData.length > 0) {
        // Fetch links untuk kategori header
        const { data: linksData, error: linksError } = await supabase
          .from("links")
          .select("*")
          .in(
            "category_id",
            categoriesData.map((cat) => cat.id)
          )
          .order("order_index", { ascending: true });

        if (linksError) {
          console.error("Error fetching links:", linksError);
        } else {
          setNavLinks(linksData || []);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Jangan tampilkan header di halaman admin dan login
  if (pathname.startsWith("/admin") || pathname.startsWith("/login")) {
    return null;
  }

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const waLink = `https://wa.me/${settings?.website_phone?.replace(/\D/g, "") || ""
    }`;
  const waDisplay = settings?.website_phone;
  const logoUrl = settings?.logo_url;

  return (
    <>
      <WidgetArea position="header" />
      <header className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/50">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex-1 md:flex md:items-center md:gap-12">
              <div className="section" id="nav-logo" data-name="Logo">
                <div className="widget Header" data-version="2" id="Header1">
                  <Link
                    className="flex items-center space-x-3 rtl:space-x-reverse logo"
                    href="/"
                    title={settings?.website_name}
                  >
                    {logoUrl && (
                      <Image
                        src={logoUrl}
                        alt={settings?.website_name || "KangLogo"}
                        width={180}
                        height={48}
                        priority
                        unoptimized
                        className="h-12 w-auto"
                      />
                    )}
                  </Link>
                </div>
              </div>
            </div>
            <div
              className="navMenu mr-4 section"
              id="navMenu"
              data-name="Navigation Menu"
            >
              <div className="widget LinkList" data-version="2" id="LinkList1">
                <div className="md:flex md:items-center md:gap-12">
                  <nav aria-label="Global" className="hidden md:block">
                    <ul className="flex items-center gap-6 text-sm">
                      {navLinks.map((link, idx) => (
                        <li key={idx}>
                          <Link
                            className="text-slate-500 dark:text-slate-400 transition hover:text-slate-500/75 dark:hover:text-slate-300"
                            href={link.url}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>

                {/* Mobile Menu */}
                <div
                  className={`mobile-menu fixed top-0 left-0 h-full w-full bg-white dark:bg-gray-900 shadow-lg z-50 md:hidden ${mobileMenuOpen ? "block" : "hidden"
                    }`}
                  id="mobile-menu"
                >
                  <div className="p-4 border-b dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        Menu
                      </h3>
                      <button
                        aria-label="Close menu"
                        className="p-1 rounded-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        type="button"
                        onClick={closeMobileMenu}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M6 18L18 6M6 6l12 12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <nav className="p-4">
                    <ul className="space-y-2">
                      {navLinks.map((link, idx) => (
                        <li key={idx}>
                          <Link
                            className="nav-item text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors block p-2"
                            href={link.url}
                            onClick={closeMobileMenu}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
                <div
                  className={`menu-overlay fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden ${mobileMenuOpen ? "block" : "hidden"
                    }`}
                  id="menu-overlay"
                  onClick={closeMobileMenu}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
