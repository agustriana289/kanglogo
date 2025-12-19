"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

interface Project {
  id: number;
  slug: string;
  title: string;
  type: string | null;
  owner: string | null;
  image_url: string | null;
  created_at: string;
  deskripsi_proyek?: string;
}

interface PublicProjectsProps {
  selectedService?: {
    id: number;
    title: string;
    slug: string;
  } | null;
  minimal?: boolean; // Mode minimal: hanya grid items tanpa sidebar, header, pagination
}

const ITEMS_PER_PAGE = 20;

export default function PublicProjects({
  selectedService,
  minimal = false,
}: PublicProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProjects();
  }, [selectedService?.title]);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      // Jika tidak ada service yang dipilih, return early
      if (!selectedService?.title) {
        console.log("PublicProjects: No selectedService, skipping fetch");
        setProjects([]);
        setLoading(false);
        return;
      }

      console.log(
        "PublicProjects: Fetching projects for service:",
        selectedService.title
      );

      // Extract key words dari service title untuk filtering yang lebih flexible
      // Contoh: "Jasa Desain Logo" -> cari projects dengan type "Logo"
      const serviceWords = selectedService.title
        .replace("Jasa ", "")
        .replace("Desain ", "")
        .replace("Jasa Desain", "")
        .trim()
        .split(" ");

      // Filter berdasarkan service yang dipilih - matching title service dengan type project
      let query = supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      // Coba filter dengan kata kunci utama dari service
      if (serviceWords.length > 0) {
        query = query.ilike("type", `%${serviceWords[0]}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } else {
        console.log("PublicProjects: Fetched", data?.length || 0, "projects");
        setProjects(data || []);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = projects.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (currentItems.length === 0) {
    console.log(
      "PublicProjects: No items to display. projects.length:",
      projects.length
    );
    return null;
  }

  return (
    <div className="w-full">
      {/* Header dengan judul */}
      <div className="pb-8 md:pb-12">
        <div className="text-center">
          <h2 className="max-w-2xl mx-auto font-manrope font-bold text-4xl text-slate-700 mb-5">
            <span className="text-primary">Portofolio</span>{" "}
            {selectedService?.title.replace("Jasa ", "")}
          </h2>
          <p className="sm:max-w-2xl sm:mx-auto text-center text-base font-normal leading-7 text-slate-700">
            Lihat hasil karya terbaru kami untuk layanan ini
          </p>
        </div>
      </div>

      {/* Grid Projects - style mirip Portfolio */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {currentItems.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.slug}`}
            className="group"
          >
            <div className="relative w-full pb-[100%] overflow-hidden cursor-pointer">
              {project.image_url ? (
                <Image
                  src={project.image_url}
                  alt={project.title}
                  fill
                  style={{ objectFit: "cover" }}
                  className="bg-white shadow-sm rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  loading="lazy"
                />
              ) : (
                <div className="bg-white shadow-sm rounded-2xl absolute top-0 left-0 w-full h-full flex items-center justify-center text-slate-500 text-xs">
                  No Image
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination - hanya jika bukan mode minimal */}
      {!minimal && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 transition"
          >
            Sebelumnya
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 rounded-lg transition ${
                currentPage === page
                  ? "bg-primary text-white"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 transition"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}
