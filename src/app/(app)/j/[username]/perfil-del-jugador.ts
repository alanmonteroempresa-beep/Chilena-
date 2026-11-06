import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { datosDelJugador } from "@/modules/carta/server-api";
import { sesionActiva } from "../../sesion";

/** El jugador del perfil y si es el de la sesión (pantallas 06, 14, 25 y 28) */
export const perfilDelJugador = cache(async (username: string, conRareza = false) => {
  const [d, sesion] = await Promise.all([
    datosDelJugador(decodeURIComponent(username), { conRareza }),
    sesionActiva(),
  ]);
  if (!d) notFound();
  return { d, esPropio: sesion?.usuario.id === d.persona.id, yo: sesion?.usuario.id ?? null };
});
