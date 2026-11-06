import { z } from "zod";

// El mismo esquema valida en el cliente y en la Server Action (CLAUDE.md)
const id = z.string().uuid("No encontramos eso.");
export const RESPUESTAS = ["VA", "NO_VA"] as const;

/** VOY / NO VOY en la app (pantalla 03) */
export const contestarSchema = z.object({ matchId: id, respuesta: z.enum(RESPUESTAS) });

/** VOY / NO VOY desde el link de WhatsApp, eligiendo su nombre (pantalla 20, sin cuenta) */
export const contestarPorLinkSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{8,40}$/, "Ese link no sirve."),
  userId: id,
  respuesta: z.enum(RESPUESTAS),
});

export const abrirPaseDeListaSchema = z.object({ matchId: id, teamId: id });

/** Alineación (pantalla 53): titulares y banca de los que van */
export const alineacionSchema = z.object({
  matchId: id,
  teamId: id,
  jugadores: z
    .array(
      z.object({
        userId: id,
        titular: z.boolean(),
        numero: z.number().int().min(0).max(99).nullable(),
        capitan: z.boolean(),
      }),
    )
    .min(1, "Elige quién juega.")
    .refine((js) => js.filter((j) => j.capitan).length <= 1, "Solo un capitán.")
    .refine((js) => new Set(js.map((j) => j.userId)).size === js.length, "Hay un jugador repetido."),
});
