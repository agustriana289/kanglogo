import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/login/",
          "/order/",
          "/faq/",
          "/generator/",
          "/category/",
          "/pages/",
        ],
      },
    ],
    sitemap: "https://kanglogo.com/sitemap.xml",
  };
}
