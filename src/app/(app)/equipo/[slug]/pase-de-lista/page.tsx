import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { Proximamente } from "@/modules/core/server-api";

export const metadata: Metadata = { title: "Pase de lista" };

export default function Pagina() {
  return <Proximamente titulo="Pase de lista" Icono={ListChecks} texto="Quién va el domingo, contestado desde WhatsApp sin cuenta. Por ahora el recorrido es de solo lectura." />;
}
