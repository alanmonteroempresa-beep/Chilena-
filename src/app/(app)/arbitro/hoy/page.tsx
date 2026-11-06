import type { Metadata } from "next";
import { Whistle } from "lucide-react";
import { Proximamente } from "@/modules/core/server-api";

export const metadata: Metadata = { title: "Tus partidos de hoy" };

export default function Pagina() {
  return <Proximamente titulo="Tus partidos de hoy" Icono={Whistle} texto="Tus partidos asignados y la cédula (pantalla 02). Llega en el bloque 2 del recorrido." />;
}
