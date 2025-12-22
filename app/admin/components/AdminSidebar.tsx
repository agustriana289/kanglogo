"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  HomeIcon,
  FolderIcon,
  CheckCircleIcon,
  PhotoIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  BuildingStorefrontIcon,
  Cog6ToothIcon,
  ReceiptPercentIcon,
  CreditCardIcon,
  ClipboardIcon,
  ViewColumnsIcon,
  NewspaperIcon,
  TagIcon,
  ShoppingCartIcon,
  StarIcon,
  ListBulletIcon,
  SunIcon,
  BoldIcon,
  LifebuoyIcon,
  ChevronDownIcon,
  XMarkIcon,
  InboxArrowDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface AdminSidebarProps {
  isCollapsed: boolean;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export default function AdminSidebar({
  isCollapsed,
  isMobileMenuOpen,
  onCloseMobileMenu,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  // On mobile, never use collapsed state for content rendering
  const actuallyCollapsed = isCollapsed && !isMobileMenuOpen;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("website_settings")
          .select("logo_url, favicon_url")
          .single();

        if (data) {
          setLogoUrl(data.logo_url || "");
          setFaviconUrl(data.favicon_url || "");
        }
      } catch (error) {
        console.error("Error fetching logo:", error);
      }
    };

    fetchSettings();
  }, []);

  const toggleGroup = (groupLabel: string) => {
    if (actuallyCollapsed) return; // Don't toggle in collapsed mode
    setOpenGroups((prev) =>
      prev.includes(groupLabel)
        ? prev.filter((g) => g !== groupLabel)
        : [...prev, groupLabel]
    );
  };

  const navGroups = [
    {
      label: "Layanan",
      icon: CurrencyDollarIcon,
      children: [
        { href: "/admin/orders", label: "Pesanan", icon: FolderIcon },
        { href: "/admin/tasks", label: "Tugas", icon: CheckCircleIcon },
        { href: "/admin/services", label: "Jasa", icon: CurrencyDollarIcon },
      ],
    },
    {
      label: "Toko",
      icon: BuildingStorefrontIcon,
      children: [
        { href: "/admin/store", label: "Produk", icon: TagIcon },
        {
          href: "/admin/store/purchases",
          label: "Pembelian",
          icon: ShoppingCartIcon,
        },
      ],
    },
    { href: "/admin/discounts", label: "Diskon", icon: ReceiptPercentIcon },
    {
      href: "/admin/payment",
      label: "Metode Pembayaran",
      icon: CreditCardIcon,
    },
    { href: "/admin/projects", label: "Portofolio Proyek", icon: PhotoIcon },
    {
      href: "/admin/testimonials",
      label: "Testimoni Pelanggan",
      icon: StarIcon,
    },
    {
      label: "Blog",
      icon: DocumentTextIcon,
      children: [
        { href: "/admin/blog", label: "Artikel", icon: DocumentTextIcon },
        {
          href: "/admin/categories",
          label: "Kategori",
          icon: ListBulletIcon,
        },
        {
          href: "/admin/comments",
          label: "Komentar",
          icon: ChatBubbleLeftIcon,
        },
      ],
    },
    {
      label: "Generator",
      icon: LifebuoyIcon,
      children: [
        {
          href: "/admin/vectors",
          label: "Logo Vector",
          icon: InboxArrowDownIcon,
        },
        { href: "/admin/generator/logo", label: "Logo", icon: SunIcon },
        {
          href: "/admin/generator/fonts",
          label: "Tambah Font",
          icon: BoldIcon,
        },
      ],
    },
    {
      label: "Kelola",
      icon: Cog6ToothIcon,
      children: [
        { href: "/admin/pages", label: "Halaman", icon: ClipboardIcon },
        {
          href: "/admin/faq",
          label: "Pertanyaan",
          icon: QuestionMarkCircleIcon,
        },
        { href: "/admin/widgets", label: "Widget", icon: ViewColumnsIcon },
        { href: "/admin/seo-manager", label: "SEO Manager", icon: MagnifyingGlassIcon },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 h-screen
        ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-64
        bg-white dark:bg-slate-800 shadow-lg border-r border-slate-200 dark:border-slate-700
        flex flex-col z-50
        transform transition-all duration-300 ease-in-out
        ${isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
          }
      `}
      >
        {/* Logo Section */}
        <div
          className={`h-16 flex items-center border-b border-slate-100 dark:border-slate-700 ${actuallyCollapsed ? "justify-center px-0" : "justify-between px-6"
            }`}
        >
          <Link
            href="/admin"
            className={`flex items-center ${actuallyCollapsed ? "justify-center" : ""
              }`}
          >
            {actuallyCollapsed ? (
              // Collapsed: Show favicon
              faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt="Icon"
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-sm">
                  KL
                </div>
              )
            ) : // Expanded: Show logo only (no text)
              logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-10 object-contain max-w-[180px]"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">
                    KL
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white text-lg">
                    KangLogo
                  </span>
                </div>
              )}
          </Link>
          <button
            onClick={onCloseMobileMenu}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {/* Dashboard Item */}
          <Link
            href="/admin"
            onClick={onCloseMobileMenu}
            title={actuallyCollapsed ? "Dashboard" : undefined}
            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200 group
                ${pathname === "/admin"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
              }
                ${actuallyCollapsed ? "justify-center px-2" : ""}
            `}
          >
            <HomeIcon
              className={`flex-shrink-0 w-5 h-5 ${pathname === "/admin"
                  ? "text-white"
                  : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                }`}
            />
            {!actuallyCollapsed && (
              <span className="font-medium text-sm">Dashboard</span>
            )}
          </Link>

          {/* Groups */}
          {navGroups.map((group: any, index) => {
            const isGroupWithChildren =
              group.children && group.children.length > 0;

            if (isGroupWithChildren) {
              const isOpen = openGroups.includes(group.label);
              const hasActiveChild = group.children.some(
                (child: any) => pathname === child.href
              );
              const GroupIcon = group.icon;

              if (actuallyCollapsed) {
                // Collapsed view: Show group icon only, maybe highlight if child active
                return (
                  <div key={index} className="relative group/tooltip">
                    <button
                      className={`
                        w-full flex justify-center items-center px-2 py-2.5 rounded-xl mb-1
                        transition-colors duration-200
                        ${hasActiveChild
                          ? "bg-primary/10 text-primary"
                          : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-600"
                        }
                      `}
                    >
                      <GroupIcon className="w-5 h-5" />
                    </button>
                    {/* Tooltip or popover could go here for collapsed menu item interaction */}
                  </div>
                );
              }

              // Expanded view
              return (
                <div key={index} className="mb-1">
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors duration-200
                      ${hasActiveChild
                        ? "bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white font-medium"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <GroupIcon
                        className={`w-5 h-5 ${hasActiveChild ? "text-primary" : "text-slate-400"
                          }`}
                      />
                      <span className="font-medium text-sm">{group.label}</span>
                    </div>
                    <ChevronDownIcon
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                      }`}
                  >
                    <div className="pl-3 space-y-1 border-l-2 border-slate-100 dark:border-slate-700 ml-5 my-1">
                      {group.children.map((child: any) => {
                        const isActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onCloseMobileMenu}
                            className={`
                                flex items-center px-3 py-2 rounded-lg text-sm transition-colors
                                ${isActive
                                ? "text-primary font-medium bg-primary/5"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                              }
                            `}
                          >
                            <span className="truncate">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            } else {
              // Standalone Link
              const isActive = pathname === group.href;
              const Icon = group.icon;

              return (
                <Link
                  key={index}
                  href={group.href}
                  onClick={onCloseMobileMenu}
                  title={actuallyCollapsed ? group.label : undefined}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1
                    transition-all duration-200 group
                    ${isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                    }
                    ${actuallyCollapsed ? "justify-center px-2" : ""}
                  `}
                >
                  <Icon
                    className={`flex-shrink-0 w-5 h-5 ${isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                      }`}
                  />
                  {!actuallyCollapsed && (
                    <span className="font-medium text-sm">{group.label}</span>
                  )}
                </Link>
              );
            }
          })}
        </nav>
      </aside>
    </>
  );
}
