import type { Metadata } from "next";
import { IconoEstadio } from "@/shared/ui/iconos";
import { Proximamente } from "@/modules/core/server-api";

export const metadata: Metadata = { title: "Mi liga" };

export default function Pagina() {
  return <Proximamente titulo="Mi liga" Icono={IconoEstadio} texto="La tabla, el rol de juegos, el goleo y cada partido de tu liga. Llega en el bloque 4 del recorrido." />;
}
