// next.config.js
const withPWA = require("next-pwa")({
  dest: "public", // Folder tempat service worker akan disimpan
  register: true,
  skipWaiting: true,

  // INI BAGIAN YANG PENTING
  manifest: {
    name: "KangLogo.com Dashboard", // Nama lengkap aplikasi (akan muncul di prompt install)
    short_name: "KangLogo.com", // Nama singkat (akan muncul di homescreen)
    description: "Aplikasi admin untuk mengelola KangLogo.com", // Deskripsi aplikasi
    start_url: "/admin", // Halaman yang dibuka saat ikon diklik
    display: "standalone", // Tampilan fullscreen tanpa browser
    background_color: "#ffffff", // Warna background splash screen
    theme_color: "#000000", // Warna tema browser
    orientation: "portrait", // Orientasi layar

    // Pastikan Anda memiliki ikon-ikon ini di folder public/icons/
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
});

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... konfigurasi lainnya
  images: {
    domains: ["i.ibb.co", "ibb.co"],
  },
};

module.exports = withBundleAnalyzer(withPWA(nextConfig));
