// app/projects/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Project } from "@/types/project";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  UserIcon,
  TagIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import LogoLoading from "@/components/LogoLoading";

export default function AllProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]); // Tambahkan state untuk tahun
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("Semua");
  const [selectedOwner, setSelectedOwner] = useState("Semua");
  const [selectedYear, setSelectedYear] = useState("Semua"); // Tambahkan state untuk tahun yang dipilih
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, selectedType, selectedOwner, selectedYear]); // Tambahkan selectedYear ke dependency

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
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("Semua");
    setSelectedOwner("Semua");
    setSelectedYear("Semua"); // Reset filter tahun
  };

  const hasActiveFilters =
    searchQuery ||
    selectedType !== "Semua" ||
    selectedOwner !== "Semua" ||
    selectedYear !== "Semua"; // Tambahkan filter tahun ke pengecekan

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center z-50">
        <div className="flex flex-col items-center justify-center">
          <LogoLoading size="xl" />
          <p className="mt-8 text-xl text-slate-600 dark:text-slate-400">
            Jelajahi karya-karya terbaik yang telah kami hasilkan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="py-16 bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-manrope font-bold text-4xl text-slate-700 mb-5 md:text-6xl leading-tight">
            Semua <span className="text-primary">Proyek</span>
          </h1>
          <p className="text-base font-normal leading-7 text-slate-700">
            Jelajahi karya-karya terbaik yang telah kami hasilkan.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar with filters */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Filter</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Pencarian
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Cari proyek..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                </div>
              </div>

              {/* Type Filter */}
              {types.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">
                    Tipe Proyek
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedType("Semua")}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedType === "Semua"
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Semua
                    </button>
                    {types.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedType === type
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Year Filter - Tambahkan filter tahun */}
              {years.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">
                    Tahun
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedYear("Semua")}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedYear === "Semua"
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Semua
                    </button>
                    {years.map((year) => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedYear === year
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="lg:w-3/4">
            {/* Mobile filter toggle */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-white rounded-lg shadow-md"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filter
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-1 bg-primary text-white text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>
            </div>

            {/* Mobile filters */}
            {showFilters && (
              <div className="lg:hidden mb-6 bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Filter
                  </h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pencarian
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Cari proyek..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  </div>
                </div>

                {/* Type Filter */}
                {types.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-slate-700 mb-2">
                      Tipe Proyek
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedType("Semua")}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedType === "Semua"
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Semua
                      </button>
                      {types.map((type) => (
                        <button
                          key={type}
                          onClick={() => setSelectedType(type)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            selectedType === type
                              ? "bg-primary text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Year Filter - Tambahkan filter tahun untuk mobile */}
                {years.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-slate-700 mb-2">
                      Tahun
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedYear("Semua")}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedYear === "Semua"
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Semua
                      </button>
                      {years.map((year) => (
                        <button
                          key={year}
                          onClick={() => setSelectedYear(year)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            selectedYear === year
                              ? "bg-primary text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Owner Filter */}
                {owners.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-slate-700 mb-2">
                      Owner
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedOwner("Semua")}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedOwner === "Semua"
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Semua
                      </button>
                      {owners.map((owner) => (
                        <button
                          key={owner}
                          onClick={() => setSelectedOwner(owner)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            selectedOwner === owner
                              ? "bg-primary text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {owner}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            )}

            {/* Results count */}
            <div className="mb-6 flex justify-between items-center">
              <p className="text-slate-600">
                Menampilkan {filteredProjects.length} dari {projects.length}{" "}
                proyek
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Hapus Filter
                </button>
              )}
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden group"
                >
                  <Link href={`/projects/${project.slug}`}>
                    <div className="relative w-full h-64">
                      {project.image_url ? (
                        <Image
                          src={project.image_url}
                          alt={project.title}
                          fill
                          style={{ objectFit: "cover" }}
                          className="transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500">
                          Tidak Ada Gambar
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {project.title}
                    </h3>

                    <div className="flex items-center text-sm text-slate-600 mb-2">
                      <TagIcon className="h-4 w-4 mr-1" />
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {project.type}
                      </span>
                    </div>

                    {/* Tambahkan tampilan tahun */}
                    {project.start_date && (
                      <div className="flex items-center text-sm text-slate-600 mb-2">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>
                          {new Date(project.start_date).getFullYear()}
                        </span>
                      </div>
                    )}

                    <Link
                      href={`/projects/${project.slug}`}
                      className="text-primary font-semibold hover:underline"
                    >
                      Lihat Detail &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                    />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-slate-900">
                  Tidak ada proyek yang ditemukan
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Coba ubah filter atau kata kunci pencarian Anda.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Hapus Filter
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
