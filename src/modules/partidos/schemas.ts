import { z } from "zod";
import { MINUTO_MAXIMO, TIPOS_CAPTURADOS, TIPOS_DE_CORRECCION, TIPOS_DE_GOL } from "./server/services/cedula";

// El mismo esquema valida en el celular del árbitro y en la Server Action (CLAUDE.md)
const id = z.string().uuid("No encontramos eso.");
const minuto = z.number().int().min(0, "El minuto no cuadra.").max(MINUTO_MAXIMO, "El minuto no cuadra.").nullable();

export const eventoCapturadoSchema = z.object({
  id,
  tipo: z.enum(TIPOS_CAPTURADOS),
  equipoId: id,
  jugadorId: id,
  minuto,
  tipoGol: z.enum(TIPOS_DE_GOL).nullable(),
  nota: z.string().trim().max(80).nullable(),
});

/** Firma con el dedo en el celular del árbitro (pantalla 56b): el trazo es un path SVG "M x y L x y …" */
export const firmaEnCelularSchema = z.object({
  teamId: id,
  firmanteId: id,
  trazo: z.string().min(8, "Firma con el dedo.").max(20_000).regex(/^[ML0-9 ]+$/, "Esa firma no sirve."),
});

/** La cédula al final (pantallas 56a y 56b), con las firmas que se hicieron en ese celular */
export const enviarCedulaSchema = z.object({
  matchId: id,
  /** Del borrador del celular: si se manda dos veces (sin señal), cuenta una */
  clientId: id,
  jugaron: z.array(z.object({ teamId: id, userIds: z.array(id).max(40) })).length(2),
  eventos: z.array(eventoCapturadoSchema).max(80),
  observaciones: z.string().trim().max(1000),
  firmas: z
    .array(firmaEnCelularSchema)
    .max(2)
    .refine((fs) => new Set(fs.map((f) => f.teamId)).size === fs.length, "Una firma por equipo."),
});

export const firmarSchema = z.object({ matchId: id, teamId: id });

export const propuestaSchema = z.object({
  jugadorId: id.optional(),
  equipoId: id.optional(),
  minuto: minuto.optional(),
  tipo: z.enum(TIPOS_CAPTURADOS).optional(),
  tipoGol: z.enum(TIPOS_DE_GOL).nullable().optional(),
});

/** El delegado señala un error antes de firmar (pantalla 19) */
export const pedirCorreccionSchema = z
  .object({
    matchId: id,
    teamId: id,
    kind: z.enum(TIPOS_DE_CORRECCION),
    eventoId: id.nullable(),
    propuesta: propuestaSchema,
    comentario: z.string().trim().max(500),
  })
  .superRefine((c, ctx) => {
    const falta = (message: string) => ctx.addIssue({ code: "custom", message });
    if (c.kind !== "FALTA_EVENTO" && !c.eventoId) falta("Toca el evento que está mal.");
    if (c.kind === "FALTA_EVENTO" && (!c.propuesta.tipo || !c.propuesta.jugadorId || !c.propuesta.equipoId))
      falta("Di qué pasó y quién fue.");
    if (c.kind === "JUGADOR_EQUIVOCADO" && (!c.propuesta.jugadorId || !c.propuesta.equipoId)) falta("¿Quién fue?");
    if (c.kind === "MINUTO" && c.propuesta.minuto === undefined) falta("¿En qué minuto fue?");
    if (c.kind === "TIPO_EVENTO" && !c.propuesta.tipo) falta("¿Qué fue en realidad?");
  });

export const responderCorreccionSchema = z.object({ correctionId: id, aceptar: z.boolean() });

export type EnviarCedula = z.infer<typeof enviarCedulaSchema>;
export type PedirCorreccion = z.infer<typeof pedirCorreccionSchema>;
