import type { Metadata } from "next";
import { Search } from "lucide-react";
import { Proximamente } from "@/modules/core/server-api";

export const metadata: Metadata = { title: "Buscar" };

export default function Pagina() {
  return <Proximamente titulo="Buscar" Icono={Search} texto="Busca jugadores, equipos y ligas aunque escribas con errores de dedo. Llega después del recorrido." />;
}
