import type { MetadataRoute } from "next";

// PWA (docs/ROADMAP.md Fase 0 · pantallas 08b y 43). Íconos del logo en public/brand/; el service worker es public/sw.js.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "chilena",
    short_name: "chilena",
    description: "Del llano a tu celular. La red social del fútbol llanero.",
    id: "/inicio",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07090c",
    theme_color: "#07090c",
    lang: "es-MX",
    // El ícono es el círculo del logo sobre azul de marca: sirve también como "maskable" (Android lo recorta)
    icons: [
      { src: "/brand/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icono-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Mi liga", url: "/mi-liga", icons: [{ src: "/brand/icono-192.png", sizes: "192x192" }] },
      { name: "Quiniela", url: "/mi-liga/quiniela", icons: [{ src: "/brand/icono-192.png", sizes: "192x192" }] },
      { name: "Votaciones", url: "/mi-liga/votaciones", icons: [{ src: "/brand/icono-192.png", sizes: "192x192" }] },
    ],
  };
}
