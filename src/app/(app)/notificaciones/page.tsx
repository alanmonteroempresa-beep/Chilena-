import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { Proximamente } from "@/modules/core/server-api";

export const metadata: Metadata = { title: "Avisos" };

export default function Pagina() {
  return <Proximamente titulo="Avisos" Icono={Bell} texto="Goles, resultados validados, votaciones y recordatorios. Llega después del recorrido." />;
}
