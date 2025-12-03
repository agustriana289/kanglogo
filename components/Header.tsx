// components/Header.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import WidgetArea from "./WidgetArea";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [navLinks, setNavLinks] = useState<any[]>([]);
  const pathname = usePathname();

  // Jangan tampilkan header di halaman admin dan login
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

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const waLink = `https://wa.me/${settings?.website_phone.replace(/\D/g, "")}`;
  const waDisplay = settings?.website_phone;
  const logoUrl = settings?.logo_url;

  return (
    <>
      <WidgetArea position="header" />
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex-1 md:flex md:items-center md:gap-12">
              <div className="section" id="nav-logo" name="Logo">
                <div className="widget Header" data-version="2" id="Header1">
                  <a
                    className="flex items-center space-x-3 rtl:space-x-reverse logo"
                    href="/"
                    title={settings?.website_name}
                  >
                    <img
                      className="h-12"
                      src={logoUrl}
                      alt={settings?.website_name}
                    />
                  </a>
                </div>
              </div>
            </div>
            <div
              className="navMenu mr-4 section"
              id="navMenu"
              name="Navigation Menu"
            >
              <div className="widget LinkList" data-version="2" id="LinkList1">
                <div className="md:flex md:items-center md:gap-12">
                  <nav aria-label="Global" className="hidden md:block">
                    <ul className="flex items-center gap-6 text-sm">
                      {navLinks.map((link, idx) => (
                        <li key={idx}>
                          <a
                            className="text-slate-500 transition hover:text-slate-500/75"
                            href={link.url}
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>

                {/* Mobile Menu */}
                <div
                  className={`mobile-menu fixed top-0 left-0 h-full w-full bg-white shadow-lg z-50 md:hidden ${
                    mobileMenuOpen ? "block" : "hidden"
                  }`}
                  id="mobile-menu"
                >
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-800">
                        Menu
                      </h3>
                      <button
                        aria-label="Close menu"
                        className="p-1 rounded-sm text-slate-600 hover:text-slate-800"
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
                          <a
                            className="nav-item text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors block p-2"
                            href={link.url}
                            onClick={closeMobileMenu}
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
                <div
                  className={`menu-overlay fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden ${
                    mobileMenuOpen ? "block" : "hidden"
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
