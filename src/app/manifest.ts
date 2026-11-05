import type { MetadataRoute } from "next";

// PWA (docs/ROADMAP.md Fase 0). Los íconos se generan del logo en public/brand/.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "chilena",
    short_name: "chilena",
    description: "Del llano a tu celular. La red social del fútbol llanero.",
    start_url: "/inicio",
    display: "standalone",
    background_color: "#07090c",
    theme_color: "#07090c",
    lang: "es-MX",
    icons: [
      { src: "/brand/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icono-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
