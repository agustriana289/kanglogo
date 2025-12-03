// components/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation"; // Import usePathname
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface Widget {
  id: number;
  title: string;
  content: string;
}

export default function Sidebar() {
  const pathname = usePathname(); // Dapatkan path URL saat ini
  const [categories, setCategories] = useState<Category[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);

  // Tentukan apakah kita berada di halaman blog atau tidak
  // Kita asumsikan jika path bukan /pages, maka itu adalah halaman blog
  const isBlogPage = !pathname.startsWith("/pages");

  useEffect(() => {
    fetchSidebarData();
  }, []);

  const fetchSidebarData = async () => {
    try {
      // Hanya ambil kategori jika kita berada di halaman blog
      if (isBlogPage) {
        // Pertama, ambil semua kategori
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name");

        if (categoriesError) {
          console.error("Error fetching categories:", categoriesError);
        } else {
          // Kedua, untuk setiap kategori, hitung jumlah artikel yang terkait
          const categoriesWithCounts = await Promise.all(
            categoriesData.map(async (category) => {
              const { count, error } = await supabase
                .from("article_categories")
                .select("*", { count: "exact", head: true }) // Hitung entri di tabel hubung
                .eq("category_id", category.id);

              return {
                ...category,
                count: count || 0, // Gunakan count atau 0 jika ada error
              };
            })
          );
          setCategories(categoriesWithCounts);
        }
      }

      // Fetch widgets (ini selalu dijalankan)
      const { data: widgetsData, error: widgetsError } = await supabase
        .from("widgets")
        .select("*")
        .eq("position", "sidebar")
        .order("created_at", { ascending: true });

      if (widgetsError) {
        console.error("Error fetching widgets:", widgetsError);
      } else {
        setWidgets(widgetsData || []);
      }
    } catch (error) {
      console.error("Error fetching sidebar data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-gray-200 animate-pulse rounded-lg p-4"></div>
        <div className="h-40 bg-gray-200 animate-pulse rounded-lg p-4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PERUBAHAN: Hanya render kategori jika isBlogPage benar */}
      {isBlogPage && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Kategori
          </h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {category.name}
                </span>
                <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </Link>
            ))}
            {categories.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Belum ada kategori
              </p>
            )}
          </div>
        </div>
      )}

      {/* Widgets selalu ditampilkan */}
      {widgets.map((widget) => (
        <div
          key={widget.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {widget.title}
          </h3>
          <div
            className="text-gray-700 dark:text-gray-300 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: widget.content }}
          />
        </div>
      ))}
    </div>
  );
}
