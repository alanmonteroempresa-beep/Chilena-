import type { Metadata } from "next";
import { CalendarPlus } from "lucide-react";
import { Proximamente } from "@/modules/core/server-api";

export const metadata: Metadata = { title: "Programar jornada" };

export default function Pagina() {
  return <Proximamente titulo="Programar jornada" Icono={CalendarPlus} texto="Horarios, canchas y árbitros de la jornada. Por ahora el recorrido es de solo lectura." />;
}
