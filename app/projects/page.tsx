// app/projects/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Project } from "@/types/project";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import WidgetArea from "@/components/WidgetArea";

const ITEMS_PER_PAGE = 12;

export default function AllProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("Logo");
  const [selectedOwner, setSelectedOwner] = useState("Semua");
  const [selectedYear, setSelectedYear] = useState("Semua");

  // Dropdown states
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  // Refs for click outside detection
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const ownerDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!typeDropdownOpen && !ownerDropdownOpen && !yearDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownOpen && typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setTypeDropdownOpen(false);
      }
      if (ownerDropdownOpen && ownerDropdownRef.current && !ownerDropdownRef.current.contains(event.target as Node)) {
        setOwnerDropdownOpen(false);
      }
      if (yearDropdownOpen && yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setYearDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [typeDropdownOpen, ownerDropdownOpen, yearDropdownOpen]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, selectedType, selectedOwner, selectedYear]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProjects(data || []);

      // Extract unique types and owners
      const uniqueTypes = [
        ...new Set(data?.map((project) => project.type).filter(Boolean)),
      ];
      setTypes(uniqueTypes);

      const uniqueOwners = [
        ...new Set(data?.map((project) => project.owner).filter(Boolean)),
      ];
      setOwners(uniqueOwners);

      // Extract unique years from start_date
      const projectYears = data
        ?.map((project) => {
          if (project.start_date) {
            return new Date(project.start_date).getFullYear().toString();
          }
          return null;
        })
        .filter(Boolean) as string[];

      const uniqueYears = [...new Set(projectYears)].sort(
        (a, b) => parseInt(b) - parseInt(a)
      );
      setYears(uniqueYears);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.deskripsi_proyek
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          project.type?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== "Semua") {
      filtered = filtered.filter((project) => project.type === selectedType);
    }

    // Filter by owner
    if (selectedOwner !== "Semua") {
      filtered = filtered.filter((project) => project.owner === selectedOwner);
    }

    // Filter by year
    if (selectedYear !== "Semua") {
      filtered = filtered.filter((project) => {
        if (project.start_date) {
          const projectYear = new Date(project.start_date)
            .getFullYear()
            .toString();
          return projectYear === selectedYear;
        }
        return false;
      });
    }

    setFilteredProjects(filtered);
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
        <LogoPathAnimation />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Beranda
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Semua <span className="text-primary">Proyek</span>
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Jelajahi karya-karya terbaik yang telah kami hasilkan
          </p>
        </div>

        <WidgetArea position="proyek_header" />

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari proyek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Type Filter - Custom Dropdown */}
              {types.length > 0 && (
                <div className="relative" ref={typeDropdownRef}>
                  <button
                    onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                    className="h-10 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    <TagIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedType === "Semua" ? "Tipe" : selectedType}</span>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${typeDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {typeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                      <button
                        onClick={() => {
                          setSelectedType("Semua");
                          setTypeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg transition-colors ${selectedType === "Semua"
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700"
                          }`}
                      >
                        Semua Tipe
                      </button>
                      {types.map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectedType(type);
                            setTypeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 last:rounded-b-lg transition-colors ${selectedType === type
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-700"
                            }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Year Filter - Custom Dropdown */}
              {years.length > 0 && (
                <div className="relative" ref={yearDropdownRef}>
                  <button
                    onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                    className="h-10 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedYear === "Semua" ? "Tahun" : selectedYear}</span>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${yearDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {yearDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-36 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                      <button
                        onClick={() => {
                          setSelectedYear("Semua");
                          setYearDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg transition-colors ${selectedYear === "Semua"
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700"
                          }`}
                      >
                        Semua Tahun
                      </button>
                      {years.map((year) => (
                        <button
                          key={year}
                          onClick={() => {
                            setSelectedYear(year);
                            setYearDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 last:rounded-b-lg transition-colors ${selectedYear === year
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-700"
                            }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <p className="text-sm text-gray-500 mb-4">
          Menampilkan {currentItems.length} dari {filteredProjects.length} proyek
        </p>

        {/* Projects Grid */}
        {currentItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada proyek yang ditemukan</h3>
            <p className="text-gray-500">Coba ubah filter pencarian Anda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentItems.map((project, index) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
              >
                {/* Image */}
                <div className="relative w-full h-48">
                  {project.image_url ? (
                    <Image
                      src={project.image_url}
                      alt={project.title}
                      fill
                      style={{ objectFit: "cover" }}
                      className="transition-transform duration-300 hover:scale-105"
                      unoptimized
                      loading={index < 4 ? "eager" : "lazy"}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm">
                      Tidak Ada Gambar
                    </div>
                  )}
                  {/* Badge Type */}
                  {project.type && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <TagIcon className="h-3 w-3 mr-1" />
                        {project.type}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {project.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    {/* Year */}
                    {project.start_date && (
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {new Date(project.start_date).getFullYear()}
                      </span>
                    )}
                    {/* Link Detail */}
                    <span className="text-xs text-primary font-medium hover:underline">
                      Lihat Detail →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Page navigation" className="flex justify-center mt-10">
            <ul className="flex -space-x-px text-sm">
              {/* Previous Button */}
              <li>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center text-gray-600 bg-white box-border border border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-s-lg text-sm px-3 h-10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
              </li>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <li key={page}>
                  <button
                    onClick={() => setCurrentPage(page)}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={`flex items-center justify-center box-border border font-medium text-sm w-10 h-10 focus:outline-none transition-colors ${currentPage === page
                      ? "text-primary bg-gray-100 border-gray-200 hover:text-primary"
                      : "text-gray-600 bg-white border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                  >
                    {page}
                  </button>
                </li>
              ))}

              {/* Next Button */}
              <li>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center text-gray-600 bg-white box-border border border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-e-lg text-sm px-3 h-10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        )}

        <WidgetArea position="proyek_footer" />
      </div>
    </main>
  );
}
