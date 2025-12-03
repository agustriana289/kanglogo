// components/WidgetArea.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
  position: string;
}

// Props untuk komponen WidgetArea
interface WidgetAreaProps {
  position: string; // Posisi widget yang akan ditampilkan (wajib diisi)
  showCategories?: boolean; // Opsi untuk menampilkan kategori, default false
}

export default function WidgetArea({
  position,
  showCategories = false,
}: WidgetAreaProps) {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);

  // Tentukan apakah kita berada di halaman blog atau tidak
  const isBlogPage =
    !pathname.startsWith("/pages") &&
    !pathname.startsWith("/store") &&
    !pathname.startsWith("/admin");

  useEffect(() => {
    fetchWidgetData();
  }, [position]); // Refetch data jika posisi berubah

  const fetchWidgetData = async () => {
    setLoading(true);
    try {
      // Hanya ambil kategori jika showCategories bernilai true dan kita berada di halaman blog
      if (showCategories && isBlogPage) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name");

        if (categoriesError) {
          console.error("Error fetching categories:", categoriesError);
        } else {
          const categoriesWithCounts = await Promise.all(
            categoriesData.map(async (category) => {
              const { count, error } = await supabase
                .from("article_categories")
                .select("*", { count: "exact", head: true })
                .eq("category_id", category.id);

              return {
                ...category,
                count: count || 0,
              };
            })
          );
          setCategories(categoriesWithCounts);
        }
      } else {
        setCategories([]); // Kosongkan kategori jika tidak ditampilkan
      }

      // Fetch widgets berdasarkan position yang diterima
      const { data: widgetsData, error: widgetsError } = await supabase
        .from("widgets")
        .select("*")
        .eq("position", position) // Gunakan posisi dari props
        .order("created_at", { ascending: true });

      if (widgetsError) {
        console.error("Error fetching widgets:", widgetsError);
      } else {
        setWidgets(widgetsData || []);
      }
    } catch (error) {
      console.error("Error fetching widget data:", error);
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

  // Jika tidak ada widget dan tidak ada kategori yang ditampilkan, tidak render apa-pun
  if (widgets.length === 0 && categories.length === 0) {
    return null;
  }

  return (
    <div id="widget">
      {/* Tampilkan Kategori hanya jika showCategories true dan ada data kategori */}
      {showCategories && categories.length > 0 && (
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
          </div>
        </div>
      )}

      {/* Render widget berdasarkan posisi */}
      {widgets.map((widget) => (
        <div key={widget.id}>
          <div
            className="text-gray-700 dark:text-gray-300 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: widget.content }}
          />
        </div>
      ))}
    </div>
  );
}
