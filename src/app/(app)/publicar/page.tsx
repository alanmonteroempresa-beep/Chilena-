import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Proximamente } from "@/modules/core/server-api";

export const metadata: Metadata = { title: "Publicar" };

export default function Pagina() {
  return <Proximamente titulo="Publicar" Icono={Plus} texto="Por ahora el recorrido es de solo lectura: publicar, comentar y echar fuego llegan después." />;
}
