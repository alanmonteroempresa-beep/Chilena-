import type { Metadata } from "next";
import { PantallaProvisional } from "@/modules/core/server-api";
import { isEnabled } from "@/modules/core/server-api";
import { ActivarAvisos } from "@/modules/notificaciones";

// PROVISIONAL hasta el menú de perfil (pantalla 07): quién entró, accesos a su perfil público y Salir
export const metadata: Metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const conPush = await isEnabled("push.enabled");
  return <PantallaProvisional variante="perfil" avisos={conPush ? <ActivarAvisos /> : null} />;
}
