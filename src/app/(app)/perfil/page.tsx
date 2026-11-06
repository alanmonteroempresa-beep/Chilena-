import type { Metadata } from "next";
import { PantallaProvisional } from "@/modules/core/server-api";

// PROVISIONAL hasta el bloque 3 (perfil público 06, carta 25 e insignias)
export const metadata: Metadata = { title: "Mi perfil" };

export default function PerfilPage() {
  return <PantallaProvisional variante="perfil" />;
}
