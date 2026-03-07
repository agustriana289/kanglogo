"use client";

import { useState } from "react";

interface AvatarProps {
  url?: string | null;
  name: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

export default function Avatar({ url, name, imageClassName, fallbackClassName }: AvatarProps) {
  // Simpan URL yang gagal dimuat, bukan boolean, ini sekaligus fix masalah useEffect
  const [imgErrorUrl, setImgErrorUrl] = useState<string | null>(null);

  if (!url || url === "null" || !url.startsWith("http") || imgErrorUrl === url) {
    // Ambil 1 huruf pertama untuk inisial (atau 2 jika diinginkan, namun 1 lebih aman)
    const initial = name ? name.charAt(0).toUpperCase() : "U";
    return (
      <div className={fallbackClassName}>
        {initial}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      className={imageClassName}
      referrerPolicy="no-referrer"
      onError={() => {
        setImgErrorUrl(url);
      }}
    />
  );
}
