// components/SocialShare.tsx
"use client";

import { Facebook, Twitter, MessageCircle, Link2 } from "lucide-react"; // PERUBAHAN: Whatsapp diganti dengan MessageCircle

interface SocialShareProps {
  url: string;
  title: string;
}

export default function SocialShare({ url, title }: SocialShareProps) {
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      url
    )}&text=${encodeURIComponent(title)}`,
    // PERUBAHAN: Menggunakan API web WhatsApp yang lebih standar
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${title} ${url}`
    )}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    alert("Link berhasil disalin!");
  };

  return (
    <div className="flex items-center space-x-4">
      <span className="text-gray-600">Bagikan:</span>
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800"
      >
        <Facebook size={20} />
      </a>
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sky-500 hover:text-sky-700"
      >
        <Twitter size={20} />
      </a>
      <a
        href={shareLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-600 hover:text-green-800"
      >
        <MessageCircle size={20} />{" "}
        {/* PERUBAHAN: Whatsapp diganti dengan MessageCircle */}
      </a>
      <button
        onClick={copyToClipboard}
        className="text-gray-600 hover:text-gray-800"
      >
        <Link2 size={20} />
      </button>
    </div>
  );
}
