// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... konfigurasi lainnya
  images: {
    domains: ["i.ibb.co", "ibb.co"],
  },
};

module.exports = withPWA(nextConfig);
