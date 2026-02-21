import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/services", "/about", "/pricing", "/news", "/contact", "/faq", "/forum", "/join", "/lp/"],
        disallow: ["/admin", "/admin/*", "/login", "/api/*"],
      },
    ],
    sitemap: "https://creedava.com/sitemap.xml",
  };
}
