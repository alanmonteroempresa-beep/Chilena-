import { z } from "zod";

// El mismo esquema valida en el cliente y en la Server Action (CLAUDE.md)
const id = z.string().uuid("No encontramos eso.");
const texto = (max: number, vacio: string) =>
  z
    .string()
    .transform((s) => s.replace(/\s+\n/g, "\n").trim())
    .pipe(z.string().min(1, vacio).max(max, `Máximo ${max} caracteres.`));

export const TIPOS_DE_REACCION = ["FUEGO", "GOLAZO", "TROFEO"] as const;
export const reaccionSchema = z.object({ postId: id, tipo: z.enum(TIPOS_DE_REACCION) });

/** La porra: en una publicación o en el muro de un jugador (PRD §6.3) */
export const comentarioSchema = z
  .object({
    postId: id.optional(),
    muroDe: id.optional(),
    texto: texto(500, "Escribe algo para la porra."),
  })
  .refine((v) => Boolean(v.postId) !== Boolean(v.muroDe), { message: "¿Dónde va el comentario?" });

/** Publicar (pantalla 34): texto; fotos y videos llegan después (flag media.posts) */
export const publicacionSchema = z.object({ texto: texto(500, "Escribe algo para publicar.") });

export const seguirSchema = z
  .object({ persona: id.optional(), equipo: id.optional(), seguir: z.boolean() })
  .refine((v) => Boolean(v.persona) !== Boolean(v.equipo), { message: "¿A quién quieres seguir?" });

export const MOTIVOS_DE_REPORTE = ["INSULTO", "AMENAZA", "DISCRIMINACION", "OTRO"] as const;
export const reporteSchema = z.object({ comentarioId: id, motivo: z.enum(MOTIVOS_DE_REPORTE) });
