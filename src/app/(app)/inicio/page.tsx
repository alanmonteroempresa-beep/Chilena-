import type { Metadata } from "next";
import { PantallaProvisional } from "@/modules/core/server-api";

// PROVISIONAL hasta las pantallas 03/05 (módulo social)
export const metadata: Metadata = { title: "Inicio" };

export default function InicioPage() {
  return <PantallaProvisional variante="inicio" />;
}
