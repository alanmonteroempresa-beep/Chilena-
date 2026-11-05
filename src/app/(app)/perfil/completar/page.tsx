import type { Metadata } from "next";
import { PantallaProvisional } from "@/modules/core/server-api";

// PROVISIONAL hasta la pantalla 40 · Completa tu perfil
export const metadata: Metadata = { title: "Completa tu perfil" };

export default function CompletarPerfilPage() {
  return <PantallaProvisional variante="completar" />;
}
