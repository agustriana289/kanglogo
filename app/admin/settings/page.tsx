// app/admin/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/supabase-storage";
import LogoLoading from "@/components/LogoLoading";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // State untuk pengaturan umum
  const [generalSettings, setGeneralSettings] = useState({
    id: 1,
    logo_url: "",
    favicon_url: "",
    website_name: "",
    website_description: "",
    website_email: "",
    website_phone: "",
    website_author: "",
    website_country: "",
    website_language: "id",
  });

  // State untuk meta tags
  const [metaTags, setMetaTags] = useState<any[]>([]);
  const [verificationTags, setVerificationTags] = useState<any[]>([]);
  const [newMetaTag, setNewMetaTag] = useState({
    id: "",
    name: "",
    content: "",
    property: "",
    is_verification: false,
  });

  // State untuk modal
  const [showMetaTagModal, setShowMetaTagModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [modalLinkType, setModalLinkType] = useState("header"); // 'header', 'footer', 'social'

  // State untuk link
  const [linkCategories, setLinkCategories] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [socialMedia, setSocialMedia] = useState<any[]>([]);

  // State untuk form link baru
  const [newLink, setNewLink] = useState({
    id: "",
    label: "",
    url: "",
    category_id: "",
  });
  const [newSocialMedia, setNewSocialMedia] = useState({
    id: "",
    name: "",
    url: "",
    icon_svg: "",
  });

  // State untuk accordion
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Tambahkan state untuk tracking drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingFavicon, setIsDraggingFavicon] = useState(false);

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
        setGeneralSettings(settingsData);
      }

      // Fetch meta tags
      const { data: metaTagsData, error: metaTagsError } = await supabase
        .from("meta_tags")
        .select("*")
        .order("created_at", { ascending: false });

      if (metaTagsError) {
        console.error("Error fetching meta tags:", metaTagsError);
      } else {
        setMetaTags(metaTagsData.filter((tag) => !tag.is_verification));
        setVerificationTags(metaTagsData.filter((tag) => tag.is_verification));
      }

      // Fetch link kategori
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("link_categories")
        .select("*")
        .order("order_index", { ascending: true });

      if (categoriesError) {
        console.error("Error fetching link categories:", categoriesError);
      } else {
        setLinkCategories(categoriesData || []);
      }

      // Fetch links
      const { data: linksData, error: linksError } = await supabase
        .from("links")
        .select("*")
        .order("order_index", { ascending: true });

      if (linksError) {
        console.error("Error fetching links:", linksError);
      } else {
        setLinks(linksData || []);
      }

      // Fetch social media
      const { data: socialMediaData, error: socialMediaError } = await supabase
        .from("social_media")
        .select("*")
        .order("order_index", { ascending: true });

      if (socialMediaError) {
        console.error("Error fetching social media:", socialMediaError);
      } else {
        setSocialMedia(socialMediaData || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setLoading(false);
    }
  };

  const handleSaveGeneralSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("website_settings")
        .upsert(generalSettings);

      if (error) {
        throw error;
      }

      showNotification("Pengaturan umum berhasil disimpan!", "success");
    } catch (error) {
      console.error("Kesalahan saat menyimpan pengaturan umum:", error);
      showNotification("Gagal menyimpan pengaturan umum!", "error");
    } finally {
      setSaving(false);
    }
  };

  // Fungsi untuk menangani drag and drop
  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (type === "logo") {
      setIsDraggingLogo(true);
    } else {
      setIsDraggingFavicon(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (type === "logo") {
      setIsDraggingLogo(false);
    } else {
      setIsDraggingFavicon(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (type === "logo") {
      setIsDraggingLogo(false);
    } else {
      setIsDraggingFavicon(false);
    }

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      processFile(file, type);
    }
  };

  // Fungsi untuk memproses file (baik dari drag and drop atau dari input)
  const processFile = (file: File, type: string) => {
    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      showNotification("Harap pilih file gambar!", "error");
      return;
    }

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showNotification("Ukuran file terlalu besar! Maksimal 2MB", "error");
      return;
    }

    // Simpan file ke state untuk preview
    const reader = new FileReader();
    reader.onload = (e) => {
      // Update state dengan URL baru
      setGeneralSettings((prev) => ({
        ...prev,
        [`${type}_url`]: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);

    // Upload file ke Supabase
    uploadFileToSupabase(file, type);
  };

  // Fungsi untuk upload file ke Supabase
  const uploadFileToSupabase = async (file: File, type: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    setSaving(true);
    try {
      // Upload file ke Supabase Storage
      const { publicUrl, error } = await uploadFile("assets", filePath, file);

      if (error) {
        console.error("Kesalahan saat mengunggah:", error);
        throw error;
      }

      console.log("✅ URL Publik:", publicUrl);

      // Update state dengan URL baru
      setGeneralSettings((prev) => ({
        ...prev,
        [`${type}_url`]: publicUrl,
      }));

      showNotification(
        `${type === "logo" ? "Logo" : "Favicon"} berhasil diunggah!`,
        "success"
      );
    } catch (error) {
      console.error("Kesalahan saat mengunggah file:", error);
      showNotification(
        `Gagal mengunggah ${type === "logo" ? "logo" : "favicon"}! Kesalahan: ${(error as any).message || error
        }`,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: any, type: string) => {
    const file = event.target.files[0];
    if (!file) return;

    processFile(file, type);

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      showNotification("Harap pilih file gambar!", "error");
      return;
    }

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showNotification("Ukuran file terlalu besar! Maksimal 2MB", "error");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    setSaving(true);
    try {
      // Upload file ke Supabase Storage
      const { publicUrl, error } = await uploadFile("assets", filePath, file);

      if (error) {
        console.error("Kesalahan saat mengunggah:", error);
        throw error;
      }

      console.log("✅ URL Publik:", publicUrl);

      // Update state dengan URL baru
      setGeneralSettings((prev) => ({
        ...prev,
        [`${type}_url`]: publicUrl,
      }));

      showNotification(
        `${type === "logo" ? "Logo" : "Favicon"} berhasil diunggah!`,
        "success"
      );
    } catch (error) {
      console.error("Kesalahan saat mengunggah file:", error);
      showNotification(
        `Gagal mengunggah ${type === "logo" ? "logo" : "favicon"}! Kesalahan: ${(error as any).message || error
        }`,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddMetaTag = async () => {
    if (!newMetaTag.name || !newMetaTag.content) {
      showNotification("Nama dan konten meta tag harus diisi!", "error");
      return;
    }

    setSaving(true);
    try {
      if (newMetaTag.id) {
        // Update existing meta tag
        const { error } = await supabase
          .from("meta_tags")
          .update({
            name: newMetaTag.name,
            content: newMetaTag.content,
            property: newMetaTag.property,
          })
          .eq("id", newMetaTag.id);

        if (error) throw error;
        showNotification("Meta tag berhasil diperbarui!", "success");
      } else {
        // Insert new meta tag
        const { error } = await supabase.from("meta_tags").insert(newMetaTag);

        if (error) throw error;
        showNotification("Meta tag berhasil ditambahkan!", "success");
      }

      setNewMetaTag({
        id: "",
        name: "",
        content: "",
        property: "",
        is_verification: false,
      });
      setShowMetaTagModal(false);
      fetchSettings();
    } catch (error) {
      console.error("Kesalahan saat menyimpan meta tag:", error);
      showNotification("Gagal menyimpan meta tag!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMetaTag = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("meta_tags").delete().eq("id", id);

      if (error) {
        throw error;
      }

      fetchSettings();
      showNotification("Meta tag berhasil dihapus!", "success");
    } catch (error) {
      console.error("Kesalahan saat menghapus meta tag:", error);
      showNotification("Gagal menghapus meta tag!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = async () => {
    if (!newLink.label || !newLink.url || !newLink.category_id) {
      showNotification("Label, URL, dan kategori harus diisi!", "error");
      return;
    }

    setSaving(true);
    try {
      if (newLink.id) {
        // Update existing link
        const { error } = await supabase
          .from("links")
          .update({
            label: newLink.label,
            url: newLink.url,
            category_id: newLink.category_id,
          })
          .eq("id", newLink.id);

        if (error) throw error;
        showNotification("Link berhasil diperbarui!", "success");
      } else {
        // Insert new link
        const { error } = await supabase.from("links").insert({
          label: newLink.label,
          url: newLink.url,
          category_id: newLink.category_id,
        });

        if (error) throw error;
        showNotification("Link berhasil ditambahkan!", "success");
      }

      setNewLink({ id: "", label: "", url: "", category_id: "" });
      setShowLinkModal(false);
      fetchSettings();
    } catch (error) {
      console.error("Kesalahan saat menyimpan link:", error);
      showNotification("Gagal menyimpan link!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("links").delete().eq("id", id);

      if (error) {
        throw error;
      }

      fetchSettings();
      showNotification("Link berhasil dihapus!", "success");
    } catch (error) {
      console.error("Terjadi kesalahan saat menghapus tautan:", error);
      showNotification("Gagal menghapus tautan!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSocialMedia = async () => {
    if (
      !newSocialMedia.name ||
      !newSocialMedia.url ||
      !newSocialMedia.icon_svg
    ) {
      showNotification("Nama, URL, dan ikon SVG harus diisi!", "error");
      return;
    }

    setSaving(true);
    try {
      if (newSocialMedia.id) {
        // Update existing social media
        const { error } = await supabase
          .from("social_media")
          .update({
            name: newSocialMedia.name,
            url: newSocialMedia.url,
            icon_svg: newSocialMedia.icon_svg,
          })
          .eq("id", newSocialMedia.id);

        if (error) throw error;
        showNotification("Social media berhasil diperbarui!", "success");
      } else {
        // Insert new social media
        const { error } = await supabase.from("social_media").insert({
          name: newSocialMedia.name,
          url: newSocialMedia.url,
          icon_svg: newSocialMedia.icon_svg,
        });

        if (error) throw error;
        showNotification("Social media berhasil ditambahkan!", "success");
      }

      setNewSocialMedia({ id: "", name: "", url: "", icon_svg: "" });
      setShowLinkModal(false);
      fetchSettings();
    } catch (error) {
      console.error("Kesalahan saat menyimpan social media:", error);
      showNotification("Gagal menyimpan social media!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSocialMedia = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("social_media")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      fetchSettings();
      showNotification("Social media berhasil dihapus!", "success");
    } catch (error) {
      console.error("Kesalahan saat menghapus media sosial:", error);
      showNotification("Gagal menghapus media sosial!", "error");
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (message: string, type: string) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  const getLinksByCategory = (categoryId: string) => {
    return links.filter((link) => link.category_id === categoryId);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const inputStyle =
    "bg-white dark:bg-slate-900 shadow-sm focus:border-primary focus:ring-primary/10 dark:focus:border-primary w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-none dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <LogoLoading size="lg" />
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Sedang memuat...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 border-b border-gray-200 px-5 pt-4 dark:border-gray-800">

          <button
            className={`py-2 px-4 font-medium text-sm rounded-t-lg ${activeTab === "general"
              ? "text-primary border-b-2 border-primary"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            onClick={() => setActiveTab("general")}
          >
            Pengaturan Umum
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm rounded-t-lg ${activeTab === "meta"
              ? "text-primary border-b-2 border-primary"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            onClick={() => setActiveTab("meta")}
          >
            Meta Tags
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm rounded-t-lg ${activeTab === "links"
              ? "text-primary border-b-2 border-primary"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            onClick={() => setActiveTab("links")}
          >
            Tautan
          </button>
        </div>

        {/* Modal Tambah Meta Tag */}
        {showMetaTagModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 w-96 max-w-full mx-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                {newMetaTag.id ? "Edit Meta Tag" : "Tambah Meta Tag Baru"}
              </h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama
                  </label>
                  <input
                    type="text"
                    placeholder="misal: description"
                    className={inputStyle}
                    value={newMetaTag.name}
                    onChange={(e) =>
                      setNewMetaTag({ ...newMetaTag, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Konten
                  </label>
                  <input
                    type="text"
                    placeholder="Konten meta tag"
                    className={inputStyle}
                    value={newMetaTag.content}
                    onChange={(e) =>
                      setNewMetaTag({ ...newMetaTag, content: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Properti (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="misal: og:title"
                    className={inputStyle}
                    value={newMetaTag.property}
                    onChange={(e) =>
                      setNewMetaTag({ ...newMetaTag, property: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowMetaTagModal(false);
                    setNewMetaTag({
                      id: "",
                      name: "",
                      content: "",
                      property: "",
                      is_verification: false,
                    });
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMetaTag}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 disabled:opacity-50"
                >
                  {saving
                    ? newMetaTag.id
                      ? "Menyimpan..."
                      : "Menambahkan..."
                    : newMetaTag.id
                      ? "Simpan"
                      : "Tambah"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tambah Verifikasi */}
        {showVerificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 w-96 max-w-full mx-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                {newMetaTag.id
                  ? "Edit Meta Tag Verifikasi"
                  : "Tambah Meta Tag Verifikasi"}
              </h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama
                  </label>
                  <input
                    type="text"
                    placeholder="misal: google-site-verification"
                    className={inputStyle}
                    value={newMetaTag.name}
                    onChange={(e) =>
                      setNewMetaTag({
                        ...newMetaTag,
                        name: e.target.value,
                        is_verification: true,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kode Verifikasi
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan kode verifikasi"
                    className={inputStyle}
                    value={newMetaTag.content}
                    onChange={(e) =>
                      setNewMetaTag({
                        ...newMetaTag,
                        content: e.target.value,
                        is_verification: true,
                      })
                    }
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowVerificationModal(false);
                    setNewMetaTag({
                      id: "",
                      name: "",
                      content: "",
                      property: "",
                      is_verification: false,
                    });
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddMetaTag}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 disabled:opacity-50"
                >
                  {saving
                    ? newMetaTag.id
                      ? "Menyimpan..."
                      : "Menambahkan..."
                    : newMetaTag.id
                      ? "Simpan"
                      : "Tambah"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification.show && (
          <div
            className={`mb-4 p-4 rounded-lg ${notification.type === "success"
              ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300"
              }`}
          >
            {notification.message}
          </div>
        )}

        {/* General Settings Tab */}
        {activeTab === "general" && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Logo
                </label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="logo-dropzone-file"
                    className={`flex flex-col items-center justify-center w-full h-64 bg-neutral-secondary-medium border border-dashed border-default-strong rounded-2xl cursor-pointer hover:bg-neutral-tertiary-medium ${isDraggingLogo ? "bg-slate-200 border-primary" : ""
                      }`}
                    onDragOver={(e) => handleDragOver(e, "logo")}
                    onDragLeave={(e) => handleDragLeave(e, "logo")}
                    onDrop={(e) => handleDrop(e, "logo")}
                  >
                    {generalSettings.logo_url ? (
                      <div className="flex flex-col items-center justify-center">
                        <img
                          src={generalSettings.logo_url}
                          alt="Logo"
                          className="h-32 w-auto object-contain mb-4"
                        />
                        <p className="text-sm text-slate-500">
                          Klik atau seret untuk mengganti logo
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-body pt-5 pb-6">
                        <svg
                          className="w-8 h-8 mb-4"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"
                          />
                        </svg>
                        <p className="mb-2 text-sm">
                          <span className="font-semibold">
                            Klik untuk mengunggah
                          </span>{" "}
                          atau seret dan lepas
                        </p>
                        <p className="text-xs">
                          SVG, PNG, JPG, atau GIF (MAKS. 800x400px)
                        </p>
                      </div>
                    )}
                    <input
                      id="logo-dropzone-file"
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "logo")}
                      accept="image/*"
                    />
                  </label>
                </div>
              </div>

              {/* Favicon Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Favicon
                </label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="favicon-dropzone-file"
                    className={`flex flex-col items-center justify-center w-full h-64 bg-neutral-secondary-medium border border-dashed border-default-strong rounded-2xl cursor-pointer hover:bg-neutral-tertiary-medium ${isDraggingFavicon ? "bg-slate-200 border-primary" : ""
                      }`}
                    onDragOver={(e) => handleDragOver(e, "favicon")}
                    onDragLeave={(e) => handleDragLeave(e, "favicon")}
                    onDrop={(e) => handleDrop(e, "favicon")}
                  >
                    {generalSettings.favicon_url ? (
                      <div className="flex flex-col items-center justify-center">
                        <img
                          src={generalSettings.favicon_url}
                          alt="Favicon"
                          className="h-32 w-auto object-contain mb-4"
                        />
                        <p className="text-sm text-slate-500">
                          Klik atau seret untuk mengganti favicon
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-body pt-5 pb-6">
                        <svg
                          className="w-8 h-8 mb-4"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"
                          />
                        </svg>
                        <p className="mb-2 text-sm">
                          <span className="font-semibold">
                            Klik untuk mengunggah
                          </span>{" "}
                          atau seret dan lepas
                        </p>
                        <p className="text-xs">
                          SVG, PNG, JPG, atau GIF (MAKS. 32x32px)
                        </p>
                      </div>
                    )}
                    <input
                      id="favicon-dropzone-file"
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "favicon")}
                      accept="image/*"
                    />
                  </label>
                </div>
              </div>

              {/* Website Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Judul Website
                </label>
                <input
                  type="text"
                  className={inputStyle}
                  value={generalSettings.website_name}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      website_name: e.target.value,
                    })
                  }
                />
              </div>

              {/* Website Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Website
                </label>
                <input
                  type="email"
                  className={inputStyle}
                  value={generalSettings.website_email}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      website_email: e.target.value,
                    })
                  }
                />
              </div>

              {/* Website Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Telepon Website
                </label>
                <input
                  type="tel"
                  className={inputStyle}
                  value={generalSettings.website_phone}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      website_phone: e.target.value,
                    })
                  }
                />
              </div>

              {/* Website Author */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Pemilik
                </label>
                <input
                  type="text"
                  className={inputStyle}
                  value={generalSettings.website_author}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      website_author: e.target.value,
                    })
                  }
                />
              </div>

              {/* Website Country */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Negara
                </label>
                <input
                  type="text"
                  className={inputStyle}
                  value={generalSettings.website_country}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      website_country: e.target.value,
                    })
                  }
                />
              </div>

              {/* Website Language */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Bahasa
                </label>
                <select
                  className={inputStyle}
                  value={generalSettings.website_language}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      website_language: e.target.value,
                    })
                  }
                >
                  <option value="id">Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* Website Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Deskripsi Website
              </label>
              <textarea
                rows={4}
                className={inputStyle}
                value={generalSettings.website_description}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    website_description: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveGeneralSettings}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </div>
          </div>
        )}

        {/* Meta Tags Tab */}
        {activeTab === "meta" && (
          <div className="grid lg:grid-cols-2 gap-4 items-start px-6 pb-6">
            {/* Meta Tags Section */}
            <div>
              <div className="mt-4 flex lg:justify-start mb-4">
                <button
                  onClick={() => {
                    setNewMetaTag({
                      id: "",
                      name: "",
                      content: "",
                      property: "",
                      is_verification: false,
                    });
                    setShowMetaTagModal(true);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
                >
                  + Tambah Meta Tag
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-700 dark:divide-slate-600">
                    {metaTags.map((tag) => (
                      <tr key={tag.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          {tag.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setNewMetaTag({
                                id: tag.id,
                                name: tag.name,
                                content: tag.content,
                                property: tag.property || "",
                                is_verification: false,
                              });
                              setShowMetaTagModal(true);
                            }}
                            className="text-primary hover:text-primary/80 dark:text-primary/80 dark:hover:text-primary mr-3"
                          >
                            Sunting
                          </button>
                          <button
                            onClick={() => handleDeleteMetaTag(tag.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verification Tags Section */}
            <div>
              <div className="mt-4 flex lg:justify-end mb-4">
                <button
                  onClick={() => {
                    setNewMetaTag({
                      id: "",
                      name: "",
                      content: "",
                      property: "",
                      is_verification: true,
                    });
                    setShowVerificationModal(true);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
                >
                  + Tambah Meta Verifikasi
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-700 dark:divide-slate-600">
                    {verificationTags.map((tag) => (
                      <tr key={tag.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          {tag.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setNewMetaTag({
                                id: tag.id,
                                name: tag.name,
                                content: tag.content,
                                property: tag.property || "",
                                is_verification: true,
                              });
                              setShowVerificationModal(true);
                            }}
                            className="text-primary hover:text-primary/80 dark:text-primary/80 dark:hover:text-primary mr-3"
                          >
                            Sunting
                          </button>
                          <button
                            onClick={() => handleDeleteMetaTag(tag.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Links Tab dengan Grid Layout */}
        {activeTab === "links" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 pb-6">
            {/* Header Links - 2 columns */}
            <div className="lg:col-span-2 border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
              <div>
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Label
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          URL
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-700 dark:divide-slate-600">
                      {links
                        .filter((link) => {
                          const category = linkCategories.find(
                            (cat) => cat.id === link.category_id
                          );
                          return category && category.location === "header";
                        })
                        .map((link) => (
                          <tr key={link.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                              {link.label}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                              {link.url}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => {
                                  setNewLink(link);
                                  setModalLinkType("header");
                                  setShowLinkModal(true);
                                }}
                                className="text-primary hover:text-primary/80 dark:text-primary/80 dark:hover:text-primary mr-3"
                              >
                                Sunting
                              </button>
                              <button
                                onClick={() => handleDeleteLink(link.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mx-4">
                  <button
                    onClick={() => {
                      setNewLink({
                        id: "",
                        label: "",
                        url: "",
                        category_id:
                          linkCategories.find(
                            (cat) => cat.location === "header"
                          )?.id || "",
                      });
                      setModalLinkType("header");
                      setShowLinkModal(true);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
                  >
                    + Navigasi
                  </button>
                </div>
              </div>
            </div>

            {/* Social Media - 1 column */}
            <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
              <div>
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Nama
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-700 dark:divide-slate-600">
                      {socialMedia.map((social) => (
                        <tr key={social.id}>
                          <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                            {social.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setNewSocialMedia(social);
                                setModalLinkType("social");
                                setShowLinkModal(true);
                              }}
                              className="text-primary hover:text-primary/80 dark:text-primary/80 dark:hover:text-primary mr-3"
                            >
                              Sunting
                            </button>
                            <button
                              onClick={() => handleDeleteSocialMedia(social.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mx-4 mb-4">
                  <button
                    onClick={() => {
                      setNewSocialMedia({
                        id: "",
                        name: "",
                        url: "",
                        icon_svg: "",
                      });
                      setModalLinkType("social");
                      setShowLinkModal(true);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
                  >
                    + Social Media
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Links - 3 columns grid */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              {linkCategories
                .filter((cat) => cat.location === "footer")
                .map((category) => (
                  <div
                    key={category.id}
                    className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden"
                  >
                    <div>
                      <div className="overflow-x-auto mb-4">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
                          <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Label
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                URL
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Aksi
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-700 dark:divide-slate-600">
                            {links
                              .filter(
                                (link) => link.category_id === category.id
                              )
                              .map((link) => (
                                <tr key={link.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                                    {link.label}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                                    {link.url}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                      onClick={() => {
                                        setNewLink(link);
                                        setModalLinkType("footer");
                                        setShowLinkModal(true);
                                      }}
                                      className="text-primary hover:text-primary/80 dark:text-primary/80 dark:hover:text-primary mr-3"
                                    >
                                      Sunting
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLink(link.id)}
                                      className="text-red-600 hover:text-red-900 dark:text-red-400"
                                    >
                                      Hapus
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-end mx-4 mb-4">
                        <button
                          onClick={() => {
                            setNewLink({
                              id: "",
                              label: "",
                              url: "",
                              category_id: category.id,
                            });
                            setModalLinkType("footer");
                            setShowLinkModal(true);
                          }}
                          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
                        >
                          + {category.name}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Link Modal */}
        {showLinkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                {modalLinkType === "header" &&
                  (newLink.id ? "Sunting Link Header" : "Tambah Link Header")}
                {modalLinkType === "footer" &&
                  (newLink.id ? "Sunting Link Footer" : "Tambah Link Footer")}
                {modalLinkType === "social" &&
                  (newSocialMedia.id
                    ? "Sunting Media Sosial"
                    : "Tambah Media Sosial")}
              </h2>

              <div className="space-y-4">
                {modalLinkType === "social" ? (
                  <>
                    <input
                      type="text"
                      placeholder="Nama (misal: Instagram)"
                      className={inputStyle}
                      value={newSocialMedia.name}
                      onChange={(e) =>
                        setNewSocialMedia({
                          ...newSocialMedia,
                          name: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="URL (misal: https://instagram.com/username)"
                      className={inputStyle}
                      value={newSocialMedia.url}
                      onChange={(e) =>
                        setNewSocialMedia({
                          ...newSocialMedia,
                          url: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Icon SVG"
                      className={inputStyle}
                      value={newSocialMedia.icon_svg}
                      onChange={(e) =>
                        setNewSocialMedia({
                          ...newSocialMedia,
                          icon_svg: e.target.value,
                        })
                      }
                    />
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Label (e.g., Home)"
                      className={inputStyle}
                      value={newLink.label}
                      onChange={(e) =>
                        setNewLink({ ...newLink, label: e.target.value })
                      }
                    />
                    <input
                      type="text"
                      placeholder="URL (e.g., /)"
                      className={inputStyle}
                      value={newLink.url}
                      onChange={(e) =>
                        setNewLink({ ...newLink, url: e.target.value })
                      }
                    />
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setNewLink({ id: "", label: "", url: "", category_id: "" });
                    setNewSocialMedia({
                      id: "",
                      name: "",
                      url: "",
                      icon_svg: "",
                    });
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-900 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (modalLinkType === "social") {
                      handleAddSocialMedia();
                    } else {
                      handleAddLink();
                    }
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 disabled:opacity-50"
                >
                  {modalLinkType === "social"
                    ? saving
                      ? newSocialMedia.id
                        ? "Menyimpan..."
                        : "Menambahkan..."
                      : newSocialMedia.id
                        ? "Simpan"
                        : "Tambah"
                    : saving
                      ? newLink.id
                        ? "Menyimpan..."
                        : "Menambahkan..."
                      : newLink.id
                        ? "Simpan"
                        : "Tambah"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
