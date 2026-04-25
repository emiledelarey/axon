import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Axon — university study companion",
    short_name: "Axon",
    description:
      "Won't write your essay. Will make you smarter. Spaced repetition, mock exams, Socratic tutor.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0e1a",
    theme_color: "#00e6a8",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
