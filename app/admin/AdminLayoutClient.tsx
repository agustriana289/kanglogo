"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import { AlertProvider } from "@/components/providers/AlertProvider";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto collapse on small screens if needed, but CSS usually handles usage
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    // Initial check
    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
    }

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!mounted) {
    return null; // or a loading skeleton
  }

  return (
    <AlertProvider>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
        {/* Sidebar */}
        <AdminSidebar
          isCollapsed={isCollapsed}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Wrapper */}
        <div
          className={`transition-all duration-300 min-h-screen flex flex-col ${
            isCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          {/* Header */}
          <AdminHeader
            isCollapsed={isCollapsed}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          {/* Page Content */}
          {/* Removed p-4 sm:p-6 lg:p-8 to likely avoid double padding on existing pages */}
          <main className="flex-1">{children}</main>
        </div>

        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </AlertProvider>
  );
}
