import { z } from "zod";
import { GOLES_MAXIMOS } from "./server/services/quiniela";

// El mismo esquema valida en el celular y en la Server Action (CLAUDE.md)
const id = z.string().uuid("No encontramos eso.");
const goles = z.number().int().min(0, "El marcador no cuadra.").max(GOLES_MAXIMOS, "El marcador no cuadra.");

/** Un toque por voto (pantalla 12) */
export const votarSchema = z.object({ pollId: id, optionId: id });

/** "Mandar mi pronóstico · 2-1" (pantalla 13) */
export const pronosticarSchema = z.object({ matchId: id, local: goles, visita: goles });
