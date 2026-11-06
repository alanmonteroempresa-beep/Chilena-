import type { Metadata } from "next";
import { Radio } from "lucide-react";
import { Proximamente } from "@/modules/core/server-api";

export const metadata: Metadata = { title: "En vivo" };

export default function Pagina() {
  return <Proximamente titulo="En vivo" Icono={Radio} texto="Los partidos que se están jugando, con el marcador de la banda (NO OFICIAL) hasta que llegue la cédula. Llega en el bloque 4 del recorrido." />;
}
