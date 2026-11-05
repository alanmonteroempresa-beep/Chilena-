/**
 * Entrar y a dónde va cada quien (PRD §4.1 y §4.4 · pantallas 01 y 40). Servicio puro: sin base ni Next.
 */

export const DESTINO_INICIO = "/inicio";
export const DESTINO_COMPLETAR = "/perfil/completar";

/**
 * Solo rutas internas de Chilena: evita redirecciones abiertas (`//otro.com`, `https://…`, `/\otro.com`)
 * y que el `next` mande de regreso a entrar o a las rutas de auth.
 */
export function rutaSegura(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  let url: URL;
  try {
    url = new URL(next, "https://chilena.invalid");
  } catch {
    return null;
  }
  if (url.origin !== "https://chilena.invalid") return null;
  if (url.pathname === "/" || url.pathname === "/entrar" || url.pathname.startsWith("/auth/")) return null;
  return `${url.pathname}${url.search}`;
}

/** Registro en 30 segundos (PRD §4.4): nombre y apodo. La foto se puede saltar (pantalla 40). */
export function necesitaCompletarPerfil(u: { nombre: string; sobrenombre: string | null }): boolean {
  return !u.nombre.trim() || !u.sobrenombre?.trim();
}

/** Después de entrar: Completa tu perfil si le falta nombre o apodo; si no, a donde iba o a su inicio. */
export function destinoTrasEntrar(
  u: { nombre: string; sobrenombre: string | null },
  next?: string | null,
): string {
  const seguro = rutaSegura(next);
  if (necesitaCompletarPerfil(u)) {
    return seguro ? `${DESTINO_COMPLETAR}?next=${encodeURIComponent(seguro)}` : DESTINO_COMPLETAR;
  }
  return seguro ?? DESTINO_INICIO;
}

/** "El Chícharo" → "el-chicharo" */
export function aSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/g, "");
}

/** Base del username: el nombre que trae Google o la parte del correo antes de la @ */
export function usernameBase(nombre: string | null | undefined, email: string | null | undefined): string {
  const desdeNombre = aSlug(nombre ?? "");
  if (desdeNombre.length >= 3) return desdeNombre;
  const desdeCorreo = aSlug((email ?? "").split("@")[0].replace(/\+.*$/, ""));
  return desdeCorreo.length >= 3 ? desdeCorreo : "llanero";
}

/** Candidatos en orden: base, base-2 … base-9 y luego con 4 dígitos al azar */
export function candidatosUsername(base: string, azar: () => number = Math.random): string[] {
  const numerados = Array.from({ length: 8 }, (_, i) => `${base}-${i + 2}`);
  const alAzar = Array.from({ length: 5 }, () => `${base}-${1000 + Math.floor(azar() * 9000)}`);
  return [base, ...numerados, ...alAzar];
}

/** Nombre que trae el proveedor (Google: given_name / family_name / full_name). El link mágico no trae nada. */
export function nombreDesdeAuth(metadata: Record<string, unknown> | null | undefined): {
  nombre: string;
  apellidos: string | null;
} {
  const texto = (k: string) => (typeof metadata?.[k] === "string" ? (metadata[k] as string).trim() : "");
  const dado = texto("given_name");
  const familia = texto("family_name");
  if (dado) return { nombre: dado, apellidos: familia || null };
  const completo = texto("full_name") || texto("name");
  if (!completo) return { nombre: "", apellidos: null };
  const [primero, ...resto] = completo.split(/\s+/);
  return { nombre: primero, apellidos: resto.join(" ") || null };
}

export type ErrorDeEntrada =
  | "LINK_VENCIDO"
  | "SIN_SESION"
  | "CORREO_INVALIDO"
  | "SIN_PERMISO_CORREO"
  | "MUCHOS_INTENTOS"
  | "CREDENCIALES"
  | "PRUEBA_APAGADA"
  | "FALLA";

/** Mensajes amables de la pantalla 01 (español de México) */
export const MENSAJE_ERROR_ENTRADA: Record<ErrorDeEntrada, string> = {
  LINK_VENCIDO: "Ese link ya se usó o ya venció. Pide uno nuevo y ábrelo luego luego.",
  SIN_SESION: "No pudimos abrir tu sesión. Vuelve a pedir tu link.",
  CORREO_INVALIDO: "Ese correo no recibe mensajes. Revísalo o usa otro.",
  SIN_PERMISO_CORREO: "Por ahora la beta solo manda links a los correos invitados. Pídele acceso a tu liga.",
  MUCHOS_INTENTOS:
    "Ya te mandamos un link hace poquito. Revisa tu correo (y la carpeta de spam) o intenta en unos minutos.",
  CREDENCIALES: "Correo o contraseña incorrectos.",
  PRUEBA_APAGADA: "Las cuentas de prueba no están prendidas aquí.",
  FALLA: "Se fue la señal con el servidor. Intenta otra vez.",
};

/** Traduce el error de Supabase Auth a uno de la pantalla */
export function errorDeSupabase(
  e: { code?: string; status?: number; message?: string } | null | undefined,
): ErrorDeEntrada {
  const code = e?.code ?? "";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || e?.status === 429)
    return "MUCHOS_INTENTOS";
  if (code === "email_address_not_authorized") return "SIN_PERMISO_CORREO";
  if (code === "email_address_invalid" || code === "validation_failed") return "CORREO_INVALIDO";
  if (
    code === "otp_expired" ||
    code === "flow_state_expired" ||
    code === "flow_state_not_found" ||
    code === "bad_code_verifier"
  )
    return "LINK_VENCIDO";
  return "FALLA";
}

/**
 * ¿Es una cuenta de prueba creada por el equipo? La marca va en `app_metadata`, que solo escribe la API de
 * administración (scripts/cuentas-de-prueba.ts): nadie puede registrarse con contraseña y entrar por aquí.
 */
export function esCuentaDePrueba(appMetadata: Record<string, unknown> | null | undefined): boolean {
  return appMetadata?.cuenta_de_prueba === true;
}
