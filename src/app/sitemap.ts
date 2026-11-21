import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://cash.neongulf.com/",
      lastModified: new Date("2026-11-21"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
