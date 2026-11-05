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

/** Dominio de las cuentas de prueba (scripts/cuentas-de-prueba.ts). No es un dominio real: nadie recibe correo ahí. */
export const DOMINIO_CUENTAS_DE_PRUEBA = "prueba.chilena";

/** Entrar con cuenta de prueba (flag `auth.demo_login`): solo correos @prueba.chilena */
export const cuentaDePruebaSchema = z.object({
  email: z
    .string({ error: "Escribe el correo de la cuenta de prueba." })
    .trim()
    .toLowerCase()
    .refine((v) => v.endsWith(`@${DOMINIO_CUENTAS_DE_PRUEBA}`), {
      error: `Las cuentas de prueba terminan en @${DOMINIO_CUENTAS_DE_PRUEBA}.`,
    }),
  password: z.string({ error: "Escribe la contraseña." }).min(1, "Escribe la contraseña."),
  next: z.string().max(300).optional(),
});
