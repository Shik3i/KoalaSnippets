import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://snippets.koalastuff.net";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/public", "/stats", "/help", "/login", "/privacy", "/impressum"],
        disallow: [
          "/dashboard",
          "/admin",
          "/settings",
          "/favorites",
          "/snippets/",
          "/tools/",
          "/api/",
          "/register",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
