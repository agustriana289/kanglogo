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
};
module.exports = withBundleAnalyzer(withPWA(nextConfig));
