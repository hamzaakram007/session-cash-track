import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://session-cash-track.vercel.app/",
      lastModified: "2026-11-18",
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
