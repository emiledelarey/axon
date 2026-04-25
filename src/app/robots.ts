import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://axon.study";

/**
 * Allow indexing of public marketing surfaces (landing, pricing, legal) and
 * disallow everything that lives behind auth — those pages render an empty
 * shell to scrapers and would just dilute search results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/privacy", "/terms"],
        disallow: [
          "/api/",
          "/dashboard",
          "/study",
          "/coach",
          "/tutor",
          "/library",
          "/cohort",
          "/roadmap",
          "/exam",
          "/write",
          "/sign-in",
          "/sign-up",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
