import { z } from "zod";
import { TIPOS_DE_FALLA } from "./server/services/fallas";

// El mismo esquema en el celular y en la acción (CLAUDE.md)
export const reporteFallaSchema = z.object({
  tipo: z.enum(TIPOS_DE_FALLA),
  texto: z.string().trim().min(3, "Cuéntanos qué pasó (aunque sea poquito).").max(1900, "Es mucho texto: resúmelo un poco."),
  /** La pantalla donde estaba (se puede quitar) */
  pantalla: z.string().max(300).startsWith("/").nullable(),
  /** Modelo y versión (se puede quitar) */
  dispositivo: z
    .object({ userAgent: z.string().max(400), ancho: z.number().int(), alto: z.number().int(), instalada: z.boolean(), rol: z.string().max(30).nullable() })
    .nullable(),
});
export type ReporteFalla = z.infer<typeof reporteFallaSchema>;
