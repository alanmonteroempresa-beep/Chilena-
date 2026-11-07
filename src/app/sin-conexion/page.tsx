import type { Metadata } from "next";
import { SinConexion } from "@/modules/plataforma";

export const metadata: Metadata = { title: "Sin conexión", robots: { index: false } };

// Pantalla 08b · la guarda el service worker (public/sw.js) para cuando no hay señal. Estática.
export default function SinConexionPage() {
  return <SinConexion />;
}
