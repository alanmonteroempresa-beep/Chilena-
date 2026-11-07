import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // El indicador de desarrollo tapa el header o la barra inferior a 390 px (cualquier esquina).
  // Sin él, Next sigue mostrando los errores de compilación y de ejecución.
  devIndicators: false,
  partialPrefetching: true,
  // PWA (guía de Next 16): el service worker siempre fresco y solo con scripts propios
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
