import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Pages publiques indexables uniquement (les espaces authentifiés sont exclus).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number; freq: "weekly" | "monthly" }[] = [
    { path: "/", priority: 1, freq: "weekly" },
    { path: "/pricing", priority: 0.8, freq: "monthly" },
    { path: "/faq", priority: 0.6, freq: "monthly" },
    { path: "/legal", priority: 0.3, freq: "monthly" },
    { path: "/privacy", priority: 0.3, freq: "monthly" },
  ];
  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));
}
