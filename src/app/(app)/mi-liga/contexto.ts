import "server-only";
import { sesionActiva } from "../sesion";

/** De qué liga es Mi liga: la del rol activo (liga, árbitro) o la del equipo (jugador, delegado, aficionado) */
export async function contextoMiLiga() {
  const sesion = await sesionActiva();
  if (!sesion?.activa) return null;
  const { activa, usuario } = sesion;
  return {
    contexto: { slugLiga: activa.slugLiga, slugEquipo: activa.slugEquipo },
    yo: usuario.id,
    rol: activa.rol,
  };
}
