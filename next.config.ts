import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // El indicador de desarrollo tapa el header o la barra inferior a 390 px (cualquier esquina).
  // Sin él, Next sigue mostrando los errores de compilación y de ejecución.
  devIndicators: false,
  partialPrefetching: true,
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
