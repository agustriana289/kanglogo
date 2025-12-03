// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
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
