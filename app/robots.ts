import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://routeapp.plexplease.xyz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      disallow: ["/admin/", "/api/"]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
