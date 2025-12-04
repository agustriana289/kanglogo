const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  images: {
    domains: ["i.ibb.co", "ibb.co"],
  },

  manifest: {
    name: "KangLogo.com Dashboard",
    short_name: "KangLogo.com",
    description: "Aplikasi admin untuk mengelola KangLogo.com",
    start_url: "/admin",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    orientation: "portrait",

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
};

module.exports = withBundleAnalyzer(withPWA(nextConfig));
