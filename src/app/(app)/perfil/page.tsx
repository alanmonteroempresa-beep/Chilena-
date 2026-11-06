import type { Metadata } from "next";
import { PantallaProvisional } from "@/modules/core/server-api";

// PROVISIONAL hasta el menú de perfil (pantalla 07): quién entró, accesos a su perfil público y Salir
export const metadata: Metadata = { title: "Mi perfil" };

export default function PerfilPage() {
  return <PantallaProvisional variante="perfil" />;
}
