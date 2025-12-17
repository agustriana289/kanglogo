const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Import custom service worker for push notifications
  customWorkerDir: "worker",
  // Disable PWA caching for large CSS files
  maximumFileSizeToCacheInBytes: 5000000, // 5MB
});
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
const nextConfig = {
  // Performance optimizations
  compress: true,
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
      {
        protocol: "https",
        hostname: "ibb.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    // Optimize image handling
    formats: ["image/avif", "image/webp"],
  },

  // ESLint Configuration
  eslint: {
    // Allow build to pass with warnings for now
    ignoreDuringBuilds: true,
  },

  // Experimental features for better performance
  experimental: {
    // Optimize CSS
    optimizeCss: true,
  },
};
module.exports = withBundleAnalyzer(withPWA(nextConfig));
