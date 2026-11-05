import { z } from "zod";

// El mismo esquema valida en el cliente y en la Server Action (CLAUDE.md, Convenciones)

/** Pantalla 01: entrar con link mágico al correo */
export const entrarSchema = z.object({
  email: z
    .string({ error: "Escribe tu correo." })
    .trim()
    .toLowerCase()
    .min(1, "Escribe tu correo.")
    .pipe(z.email("Ese correo no se ve bien. Revísalo.")),
  next: z.string().max(300).optional(),
});

export type EntrarInput = z.infer<typeof entrarSchema>;
