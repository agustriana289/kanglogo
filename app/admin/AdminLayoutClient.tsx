"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Bars3Icon,
  ReceiptPercentIcon,
  CreditCardIcon,
  ClipboardIcon,
  ViewColumnsIcon,
  BellIcon,
  PowerIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

// Tipe untuk notifikasi
interface Notification {
  id: number;
  type: "comment" | "discount" | "order" | "task" | "order_status";
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
}

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
    useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  // NO AUTH CHECK HERE - Let the page.tsx handle it
  // Fetch settings dari Supabase
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("website_settings")
          .select("*")
          .single();

        if (error) {
          console.error("Error fetching settings:", error);
        } else if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchSettings();
  }, []);

  // Fetch notifications dari Supabase
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error fetching notifications:", error);
        } else {
          setNotifications(data || []);
          // Hitung notifikasi yang belum dibaca
          const unread = data?.filter((n) => !n.is_read).length || 0;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchNotifications();

    // Set up real-time subscription untuk notifikasi baru
    const subscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          // Tambahkan notifikasi baru ke state
          setNotifications((prev) => [
            payload.new as Notification,
            ...prev.slice(0, 9),
          ]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Tutup dropdown notifikasi saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fungsi untuk menandai notifikasi sebagai dibaca
  const markAsRead = async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
      } else {
        // Update state lokal
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Fungsi untuk menandai semua notifikasi sebagai dibaca
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false);

      if (error) {
        console.error("Error marking all notifications as read:", error);
      } else {
        // Update state lokal
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Fungsi untuk mendapatkan ikon berdasarkan tipe notifikasi
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
        return <ChatBubbleLeftIcon className="w-5 h-5 text-blue-500" />;
      case "discount":
        return <ReceiptPercentIcon className="w-5 h-5 text-green-500" />;
      case "order":
        return <FolderIcon className="w-5 h-5 text-purple-500" />;
      case "order_status":
        return <CheckCircleIcon className="w-5 h-5 text-indigo-500" />;
      case "task":
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const logoUrl = settings?.logo_url;

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: HomeIcon },
    { href: "/admin/orders", label: "Pesanan", icon: FolderIcon },
    { href: "/admin/store", label: "Toko", icon: BuildingStorefrontIcon },
    { href: "/admin/discounts", label: "Diskon", icon: ReceiptPercentIcon },
    { href: "/admin/payment", label: "Pembayaran", icon: CreditCardIcon },
    { href: "/admin/tasks", label: "Tugas", icon: CheckCircleIcon },
    { href: "/admin/projects", label: "Proyek", icon: PhotoIcon },
    {
      href: "/admin/testimonials",
      label: "Testimoni Pelanggan",
      icon: ChatBubbleLeftIcon,
    },
    { href: "/admin/services", label: "Layanan", icon: CurrencyDollarIcon },
    { href: "/admin/blog", label: "Blog", icon: DocumentTextIcon },
    { href: "/admin/faq", label: "Pertanyaan", icon: QuestionMarkCircleIcon },
    {
      href: "/admin/landing-content",
      label: "Kelola Landingpage",
      icon: NewspaperIcon,
    },
    {
      href: "/admin/pages",
      label: "Kelola Halaman",
      icon: ClipboardIcon,
    },
    {
      href: "/admin/widgets",
      label: "Widget Dashboard",
      icon: ViewColumnsIcon,
    },
    {
      href: "/admin/settings",
      label: "Pengaturan Website",
      icon: Cog6ToothIcon,
    },
  ];

  // Fungsi untuk mendapatkan nama halaman saat ini
  const getCurrentPageTitle = () => {
    const currentItem = navItems.find((item) => item.href === pathname);
    return currentItem ? currentItem.label : "Dashboard";
  };

  const currentPageTitle = getCurrentPageTitle();

  // Fungsi untuk format waktu relatif
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Baru saja";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;

    return date.toLocaleDateString("id-ID");
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-800">
      {/* Overlay untuk mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed lg:relative lg:translate-x-0 z-50 w-80 bg-white dark:bg-slate-700 shadow-lg transition-transform duration-300 h-full overflow-hidden bg-no-repeat bg-cover bg-center bg-[url(https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjN9oQmdsmqogVJbD74a5hDrU0UJQuDbUzcQ2knFTw5YGbJz5R5i6n4FvOmqndZmNhTteIW4USYTDkTRXFEyUcEQWk5ENJbUIFBeuOj5oZqSSB1jnI6M7q7sZajQPzx1fdBQwB5dn7nC_N81UZ-bHBiH95gUgolTjWHegrPaQp6LMV-gSf_pNsUDGf-RE1N/s3125/Bg.webp)]`}
      >
        <div className="h-full flex flex-col">
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between pt-6 pb-8 px-6">
            <img
              alt={settings?.website_name}
              src={logoUrl}
              title={settings?.website_name}
              loading="lazy"
              className="lazyload h-10 brightness-0 invert opacity-90"
            />
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-white"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-colors duration-200 ${isActive
                    ? "bg-primary text-white"
                    : "text-white hover:bg-white/90 hover:text-primary"
                    }`}
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Custom Admin Header */}
        <header className="bg-white dark:bg-slate-700 shadow-md h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-600">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-600 dark:text-white md:none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex-1 flex items-center justify-between ml-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                {currentPageTitle}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notification Dropdown */}
              <div className="relative flex gap-3" ref={notificationRef}>
                <button
                  onClick={() =>
                    setIsNotificationDropdownOpen(!isNotificationDropdownOpen)
                  }
                  className="relative text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <BellIcon className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotificationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800 dark:text-white">
                        Notifikasi
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors ${!notification.is_read
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : ""
                              }`}
                            onClick={() => {
                              markAsRead(notification.id);
                              window.location.href = notification.link;
                            }}
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mr-3 mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-white">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center">
                                  <ClockIcon className="w-3 h-3 mr-1" />
                                  {formatRelativeTime(notification.created_at)}
                                </p>
                              </div>
                              {!notification.is_read && (
                                <div className="ml-2 flex-shrink-0">
                                  <span className="inline-block h-2 w-2 rounded-full bg-blue-600"></span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <BellIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-500 dark:text-slate-400">
                            Tidak ada notifikasi
                          </p>
                        </div>
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                        <Link
                          href="/admin/notifications"
                          className="block w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          Lihat Semua Notifikasi
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push("/login");
                  }}
                  className="relative text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <PowerIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto sm:p-6">{children}</main>
      </div >
    </div >
  );
}
