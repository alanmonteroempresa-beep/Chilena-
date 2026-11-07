"use client";

import { useEffect } from "react";

/**
 * Registra el service worker (`public/sw.js`): pantalla sin conexión, archivos guardados y push. Solo en
 * producción (en desarrollo guardaría archivos viejos de Turbopack).
 */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
