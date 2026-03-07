"use client";

import { useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
}

export default function ImageUploader({ value, onChange, label = "Image", folder = "general" }: ImageUploaderProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("Please upload an image file", "error");

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error } = await supabase.storage
        .from("assets")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(filePath);
      onChange(publicUrl);
      showToast("Image uploaded successfully!", "success");
    } catch (error: any) {
      showToast("Upload failed. Make sure 'assets' bucket exists and is public.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{label}</label>
      <div className="flex gap-4 items-start">
        <div className="relative group w-28 h-28 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
          {value ? (
            <>
              <img src={value} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <button
                onClick={() => onChange("")}
                type="button"
                className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 backdrop-blur-sm text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            uploading ? <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" /> : <ImageIcon className="w-7 h-7 text-slate-300" />
          )}
        </div>

        <div className="flex-1">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-4 py-4 flex items-center justify-center gap-2 text-slate-400 hover:bg-slate-100 hover:border-indigo-200 hover:text-indigo-500 transition-all cursor-pointer">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span className="text-sm font-medium">{uploading ? "Uploading..." : "Click to Upload"}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-2 px-1">Square ratio recommended. Max 2MB.</p>
        </div>
      </div>
    </div>
  );
}
