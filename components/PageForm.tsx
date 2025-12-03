// components/PageForm.tsx
"use client";

import { useState, useEffect } from "react";
import { Page } from "@/types/page";

interface PageFormProps {
  initialData: Page | null; // null untuk create, Page object untuk edit
  onSave: (data: Partial<Page>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export default function PageForm({
  initialData,
  onSave,
  onCancel,
  isSaving,
}: PageFormProps) {
  const [formData, setFormData] = useState<Partial<Page>>({
    title: "",
    slug: "",
    content: "",
    meta_description: "",
    is_published: false,
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Reset form untuk mode "buat baru"
      setFormData({
        title: "",
        slug: "",
        content: "",
        meta_description: "",
        is_published: false,
      });
    }
  }, [initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title: newTitle,
      // Hanya buat slug otomatis saat membuat baru
      slug: isEditing
        ? prev.slug
        : newTitle
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, "")
            .replace(/\s+/g, "-"),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Judul Halaman
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          value={formData.title}
          onChange={handleTitleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
        />
      </div>
      <div>
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-gray-700"
        >
          Slug (URL)
        </label>
        <input
          type="text"
          name="slug"
          id="slug"
          required
          value={formData.slug}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
        />
      </div>
      <div>
        <label
          htmlFor="meta_description"
          className="block text-sm font-medium text-gray-700"
        >
          Meta Description (untuk SEO)
        </label>
        <textarea
          name="meta_description"
          id="meta_description"
          rows={3}
          value={formData.meta_description}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
        ></textarea>
      </div>
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700"
        >
          Konten (HTML)
        </label>
        <textarea
          name="content"
          id="content"
          rows={15}
          required
          value={formData.content}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border font-mono text-sm"
        ></textarea>
        <p className="text-xs text-gray-500 mt-1">
          Anda bisa menggunakan tag HTML di sini.
        </p>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          name="is_published"
          id="is_published"
          checked={formData.is_published}
          onChange={handleInputChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label
          htmlFor="is_published"
          className="ml-2 block text-sm text-gray-900"
        >
          Terbitkan halaman ini
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSaving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
