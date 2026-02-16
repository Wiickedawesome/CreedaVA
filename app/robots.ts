import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/services", "/about", "/pricing", "/news", "/contact", "/faq", "/lp/"],
        disallow: ["/admin", "/admin/*", "/login", "/env-check"],
      },
    ],
    sitemap: "https://creedava.com/sitemap.xml",
  };
}
