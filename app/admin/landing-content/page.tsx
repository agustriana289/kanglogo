// app/admin/landing-content/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/supabase-storage";
import { PencilIcon } from "@heroicons/react/24/outline";
import LogoLoading from "@/components/LogoLoading";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

export default function LandingContentPage() {
  const [activeTab, setActiveTab] = useState("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // State untuk konten landing page
  const [content, setContent] = useState<any>({});

  // State untuk modal edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // State untuk tracking drag and drop
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("landing_page_content")
        .select("*")
        .order("section, order_index", { ascending: true });

      if (error) {
        console.error("Error fetching content:", error);
      } else {
        // Group content by section
        const groupedContent = data?.reduce((acc, item) => {
          if (!acc[item.section]) {
            acc[item.section] = {};
          }
          acc[item.section][item.key_name] = item;
          return acc;
        }, {});

        setContent(groupedContent || {});
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching content:", error);
      setLoading(false);
    }
  };

  const handleSaveContent = async (
    section: string,
    keyName: string,
    value: string
  ) => {
    setSaving(true);
    try {
      // Tentukan content_type berdasarkan keyName
      let content_type = "text";
      if (keyName.includes("image")) {
        content_type = "image";
      } else if (keyName.includes("icon")) {
        content_type = "icon";
      } else if (keyName.includes("url") || keyName.includes("link")) {
        content_type = "link";
      }

      const { error } = await supabase.from("landing_page_content").upsert(
        {
          section: section,
          key_name: keyName,
          value: value,
          content_type: content_type,
        },
        {
          onConflict: "section,key_name",
        }
      );

      if (error) {
        throw error;
      }

      // Update local state
      setContent((prev: any) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [keyName]: {
            ...prev[section]?.[keyName],
            value,
          },
        },
      }));

      showNotification("Content saved successfully!", "success");
    } catch (error) {
      console.error("Error saving content:", error);
      showNotification("Failed to save content!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    event: any,
    section: string,
    keyName: string
  ) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      showNotification("Please select an image file!", "error");
      return;
    }

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showNotification("File size is too large! Maximum is 2MB", "error");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${section}-${keyName}-${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    setSaving(true);
    try {
      // Upload file ke Supabase Storage
      const { publicUrl, error } = await uploadFile("assets", filePath, file);

      if (error) {
        console.error("Upload error:", error);
        throw error;
      }

      // Update state dengan URL baru
      setContent((prev: any) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [keyName]: {
            ...prev[section]?.[keyName],
            value: publicUrl,
          },
        },
      })); // Save to database
      await handleSaveContent(section, keyName, publicUrl);

      showNotification("Image uploaded successfully!", "success");
    } catch (error) {
      console.error("Error uploading file:", error);
      showNotification(
        `Failed to upload image! Error: ${(error as any).message || error}`,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (
    e: React.DragEvent,
    section: string,
    keyName: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];

      // Validasi tipe file
      if (!file.type.startsWith("image/")) {
        showNotification("Please select an image file!", "error");
        return;
      }

      // Validasi ukuran file (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showNotification("File size is too large! Maximum is 2MB", "error");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${section}-${keyName}-${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      setSaving(true);
      try {
        // Upload file ke Supabase Storage
        const { publicUrl, error } = await uploadFile("assets", filePath, file);

        if (error) {
          console.error("Upload error:", error);
          throw error;
        }

        // Update state dengan URL baru
        setContent((prev: any) => ({
          ...prev,
          [section]: {
            ...prev[section],
            [keyName]: {
              ...prev[section]?.[keyName],
              value: publicUrl,
            },
          },
        }));

        // Save to database
        await handleSaveContent(section, keyName, publicUrl);

        showNotification("Image uploaded successfully!", "success");
      } catch (error) {
        console.error("Error uploading file:", error);
        showNotification(
          `Failed to upload image! Error: ${(error as any).message || error}`,
          "error"
        );
      } finally {
        setSaving(false);
      }
    }
  };

  const openEditModal = (
    section: string,
    keyName: string,
    displayName: string
  ) => {
    const item = content[section]?.[keyName];
    if (item) {
      setEditingItem({
        section,
        keyName,
        displayName,
        value: item.value,
        content_type: item.content_type,
      });
      setShowEditModal(true);
    }
  };

  const handleSaveFromModal = async () => {
    if (!editingItem) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("landing_page_content").upsert(
        {
          section: editingItem.section,
          key_name: editingItem.keyName,
          value: editingItem.value,
          content_type: editingItem.content_type,
        },
        {
          onConflict: "section,key_name",
        }
      );

      if (error) {
        throw error;
      }

      // Update local state
      setContent((prev: any) => ({
        ...prev,
        [editingItem.section]: {
          ...prev[editingItem.section],
          [editingItem.keyName]: {
            ...prev[editingItem.section][editingItem.keyName],
            value: editingItem.value,
          },
        },
      }));

      showNotification("Content saved successfully!", "success");
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error saving content:", error);
      showNotification("Failed to save content!", "error");
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 md:p-6">
      <div className="bg-white dark:bg-slate-700 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6">
        {/* Tab Navigation - Responsive */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-slate-200 dark:border-slate-600 overflow-x-auto">
          <button
            className={`py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === "hero"
                ? "text-primary border-b-2 border-primary"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
            onClick={() => setActiveTab("hero")}
          >
            Hero
          </button>
          <button
            className={`py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === "featured"
                ? "text-primary border-b-2 border-primary"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
            onClick={() => setActiveTab("featured")}
          >
            Featured
          </button>
          <button
            className={`py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === "reasons"
                ? "text-primary border-b-2 border-primary"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
            onClick={() => setActiveTab("reasons")}
          >
            Reasons
          </button>
          <button
            className={`py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === "steps"
                ? "text-primary border-b-2 border-primary"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
            onClick={() => setActiveTab("steps")}
          >
            Steps
          </button>
          <button
            className={`py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === "video"
                ? "text-primary border-b-2 border-primary"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
            onClick={() => setActiveTab("video")}
          >
            Video
          </button>
          <button
            className={`py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === "call_to_action"
                ? "text-primary border-b-2 border-primary"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
            onClick={() => setActiveTab("call_to_action")}
          >
            CTA
          </button>
        </div>

        {/* Notification */}
        {notification.show && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              notification.type === "success"
                ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300"
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Hero Section Tab */}
        {activeTab === "hero" && (
          <div className="space-y-6">
            {/* Hero Background Image */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Background Image Hero
              </label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="hero-bg-upload"
                  className={`flex flex-col items-center justify-center w-full h-40 bg-neutral-secondary-medium border border-dashed border-default-strong rounded-base cursor-pointer hover:bg-neutral-tertiary-medium ${
                    isDragging ? "bg-blue-50 border-blue-500" : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, "hero", "hero_background")}
                >
                  {content.hero?.hero_background?.value ? (
                    <div className="flex flex-col items-center justify-center">
                      <img
                        src={content.hero?.hero_background?.value}
                        alt="Hero Background"
                        className="h-24 w-auto object-cover mb-2 rounded"
                      />
                      <p className="text-sm text-slate-500">
                        Click or drag to change the background.
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
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs">
                        PNG, JPG (MAX. 2MB, recommended size 1920x1080px)
                      </p>
                    </div>
                  )}
                  <input
                    id="hero-bg-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, "hero", "hero_background")
                    }
                    accept="image/*"
                  />
                </label>
              </div>
            </div>

            {/* Content Fields - Button Only */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Hero Title
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.hero?.hero_title?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal("hero", "hero_title", "Hero Title")
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Hero Subtitle
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.hero?.hero_subtitle?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal("hero", "hero_subtitle", "Hero Subtitle")
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Hero Description
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.hero?.hero_description?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal(
                      "hero",
                      "hero_description",
                      "Hero Description"
                    )
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Button Text 1
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.hero?.hero_button1_text?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal("hero", "hero_button1_text", "Button Text 1")
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Button URL 1
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.hero?.hero_button1_url?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal("hero", "hero_button1_url", "Button URL 1")
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Button Text 2
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.hero?.hero_button2_text?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal("hero", "hero_button2_text", "Button Text 2")
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Button URL 2
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.hero?.hero_button2_url?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal("hero", "hero_button2_url", "Button URL 2")
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Rating
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.hero?.hero_rating?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() => openEditModal("hero", "hero_rating", "Rating")}
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Rating Count
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.hero?.hero_rating_count?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal("hero", "hero_rating_count", "Rating Count")
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Rating Text
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.hero?.hero_rating_text?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal("hero", "hero_rating_text", "Rating Text")
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
            </div>

            {/* Client Images */}
            <div>
              <div className="grid grid-cols-5 gap-2 sm:gap-4 p-4 bg-slate-50 dark:bg-slate-600 rounded-lg">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num} className="flex flex-col items-center">
                    {content.hero?.[`client_image${num}`]?.value ? (
                      <img
                        src={content.hero?.[`client_image${num}`]?.value}
                        alt={`Client ${num}`}
                        className="h-12 w-12 rounded-full mb-2"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 mb-2"></div>
                    )}
                    <label className="cursor-pointer bg-white py-1 px-2 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50">
                      <span>Change</span>
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(e) =>
                          handleFileUpload(e, "hero", `client_image${num}`)
                        }
                        accept="image/*"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Featured Section Tab */}
        {activeTab === "featured" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {/* Featured Title */}
              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Featured Title
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.featured?.featured_title?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal(
                      "featured",
                      "featured_title",
                      "Featured Title"
                    )
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              {/* Featured Subtitle */}
              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Subtitle Featured
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.featured?.featured_subtitle?.value || "(kosong)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal(
                      "featured",
                      "featured_subtitle",
                      "Subtitle Featured"
                    )
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
            </div>

            {/* Featured Description */}
            <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Featured Description
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {content.featured?.featured_description?.value || "(empty)"}
                </p>
              </div>
              <button
                onClick={() =>
                  openEditModal(
                    "featured",
                    "featured_description",
                    "Featured Description"
                  )
                }
                className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
            </div>

            {/* Featured Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  className="rounded-lg p-4 space-y-3 p-4 bg-slate-50 rounded-l"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Icon {num}
                    </p>
                    <div className="flex items-center gap-2">
                      {content.featured?.[`featured_icon${num}`]?.value && (
                        <div
                          className="w-8 h-8 text-primary"
                          dangerouslySetInnerHTML={{
                            __html:
                              content.featured?.[`featured_icon${num}`]?.value,
                          }}
                        />
                      )}
                      <button
                        onClick={() =>
                          openEditModal(
                            "featured",
                            `featured_icon${num}`,
                            `Icon ${num}`
                          )
                        }
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Title {num}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-24 md:max-w-32">
                        {content.featured?.[`featured_title${num}`]?.value ||
                          "(kosong)"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        openEditModal(
                          "featured",
                          `featured_title${num}`,
                          `Judul ${num}`
                        )
                      }
                      className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Description {num}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-24 md:max-w-32">
                        {content.featured?.[`featured_desc${num}`]?.value ||
                          "(kosong)"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        openEditModal(
                          "featured",
                          `featured_desc${num}`,
                          `Description ${num}`
                        )
                      }
                      className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reasons Section Tab */}
        {activeTab === "reasons" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {/* Reasons Title */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Reasons Title
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-24 md:max-w-32">
                    {content.reasons?.reasons_title?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal("reasons", "reasons_title", "Reasons Title")
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              {/* Reasons Subtitle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Subtitle Reasons
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-24 md:max-w-32">
                    {content.reasons?.reasons_subtitle?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal(
                      "reasons",
                      "reasons_subtitle",
                      "Subtitle Reasons"
                    )
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
            </div>

            {/* Reasons Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="p-4 bg-slate-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Reason Title {num}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-24 md:max-w-32">
                        {content.reasons?.[`reason${num}_title`]?.value ||
                          "(empty)"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        openEditModal(
                          "reasons",
                          `reason${num}_title`,
                          `Reason Title ${num}`
                        )
                      }
                      className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Reason Description {num}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-24 md:max-w-32">
                        {content.reasons?.[`reason${num}_desc`]?.value ||
                          "(empty)"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        openEditModal(
                          "reasons",
                          `reason${num}_desc`,
                          `Reason Description ${num}`
                        )
                      }
                      className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Steps Section Tab */}
        {activeTab === "steps" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="p-4 bg-slate-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Step Title {num}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-24 md:max-w-32">
                        {content.steps?.[`step${num}_title`]?.value ||
                          "(empty)"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        openEditModal(
                          "steps",
                          `step${num}_title`,
                          `Step Title ${num}`
                        )
                      }
                      className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Step Description {num}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-24 md:max-w-32">
                        {content.steps?.[`step${num}_desc`]?.value || "(empty)"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        openEditModal(
                          "steps",
                          `step${num}_desc`,
                          `Step Description ${num}`
                        )
                      }
                      className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Section Tab */}
        {activeTab === "video" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {/* Video Title */}
              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Video Title
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.video?.video_title?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal("video", "video_title", "Video Title")
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              {/* Video URL */}
              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    YouTube Video URL
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.video?.video_url?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal("video", "video_url", "YouTube Video URL")
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              {/* Video Description */}
              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Video Description
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.video?.video_description?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal(
                      "video",
                      "video_description",
                      "Video Description"
                    )
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action Section Tab */}
        {activeTab === "call_to_action" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {/* CTA Title */}
              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    CTA Title
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.call_to_action?.cta_title?.value || "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal("call_to_action", "cta_title", "CTA Title")
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              {/* CTA Description */}
              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    CTA Description
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.call_to_action?.cta_description?.value ||
                      "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal(
                      "call_to_action",
                      "cta_description",
                      "CTA Description"
                    )
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              {/* CTA Button 1 Text */}
              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    CTA Button 1 Text
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.call_to_action?.cta_button1_text?.value ||
                      "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal(
                      "call_to_action",
                      "cta_button1_text",
                      "CTA Button 1 Text"
                    )
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              {/* CTA Button 1 URL */}
              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    CTA Button 1 URL
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.call_to_action?.cta_button1_url?.value ||
                      "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal(
                      "call_to_action",
                      "cta_button1_url",
                      "CTA Button 1 URL"
                    )
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              {/* CTA Button 2 Text */}
              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    CTA Button 2 Text
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.call_to_action?.cta_button2_text?.value ||
                      "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal(
                      "call_to_action",
                      "cta_button2_text",
                      "CTA Button 2 Text"
                    )
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>

              {/* CTA Button 2 URL */}
              <div className="flex items-stretch justify-between p-4 bg-slate-50 dark:bg-slate-600 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    CTA Button 2 URL
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {content.call_to_action?.cta_button2_url?.value ||
                      "(empty)"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openEditModal(
                      "call_to_action",
                      "cta_button2_url",
                      "CTA Button 2 URL"
                    )
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-700 rounded-lg p-4 sm:p-6 w-full max-w-full sm:max-w-lg md:max-w-2xl max-h-96 sm:max-h-screen md:max-h-96 overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              Edit {editingItem.displayName}
            </h2>

            {editingItem.content_type === "icon" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Icon SVG
                  </label>
                  <textarea
                    rows={8}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-600 dark:border-slate-500 dark:text-white font-mono text-sm"
                    value={editingItem.value || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, value: e.target.value })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Content
                  </label>
                  <textarea
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-600 dark:border-slate-500 dark:text-white"
                    value={editingItem.value || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, value: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
                className="px-3 sm:px-4 py-2 bg-slate-200 text-slate-900 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-white text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFromModal}
                disabled={saving}
                className="px-3 sm:px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 disabled:opacity-50 text-sm sm:text-base"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
