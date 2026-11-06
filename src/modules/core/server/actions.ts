"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";
import { ROLES, roleTypeDesdeRol, type Rol } from "@/shared/lib/roles";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { cuentaDePruebaSchema, entrarSchema } from "../schemas";
import { getCurrentUser } from "./auth";
import { asegurarUsuario } from "./entrada";
import { isEnabled } from "./flags";
import {
  destinoTrasEntrar,
  errorDeSupabase,
  esCuentaDePrueba,
  MENSAJE_ERROR_ENTRADA,
  rutaSegura,
} from "./services/sesion";

export type EstadoEntrar =
  | { estado: "inicial" }
  | { estado: "enviado"; email: string }
  | { estado: "error"; mensaje: string; email?: string };

/** Origen de esta petición (localhost, la vista previa de Vercel o producción). Supabase solo acepta los de su lista. */
async function origen() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** /auth/confirm?next=… (siempre con query: la plantilla del correo le agrega &token_hash=…&type=email) */
async function urlDeRegreso(next: string | null | undefined) {
  const destino = rutaSegura(next) ?? "/inicio";
  return `${await origen()}/auth/confirm?next=${encodeURIComponent(destino)}`;
}

/** F-001 Entrar · pantalla 01: manda el link mágico al correo (PRD §4.1, beta) */
export async function pedirLinkMagico(_previo: EstadoEntrar, formData: FormData): Promise<EstadoEntrar> {
  const datos = entrarSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") || undefined,
  });
  if (!datos.success) {
    return {
      estado: "error",
      mensaje: datos.error.issues[0]?.message ?? MENSAJE_ERROR_ENTRADA.FALLA,
      email: String(formData.get("email") ?? ""),
    };
  }
  const { email, next } = datos.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: await urlDeRegreso(next), shouldCreateUser: true },
  });
  if (error) {
    logger.warn("signInWithOtp falló", { code: error.code, status: error.status });
    return { estado: "error", mensaje: MENSAJE_ERROR_ENTRADA[errorDeSupabase(error)], email };
  }
  return { estado: "enviado", email };
}

/** Entrar con Google. Apagado con el flag `auth.google` hasta configurar Google Cloud. */
export async function entrarConGoogle(formData: FormData) {
  if (!(await isEnabled("auth.google"))) redirect("/entrar");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await urlDeRegreso(String(formData.get("next") ?? "")) },
  });
  if (error || !data.url) {
    logger.warn("signInWithOAuth falló", { code: error?.code, status: error?.status });
    redirect("/entrar?error=FALLA");
  }
  redirect(data.url);
}

export type EstadoCuentaDePrueba =
  { estado: "inicial" } | { estado: "error"; mensaje: string; email?: string };

/**
 * Entrar con cuenta de prueba (flag `auth.demo_login`, solo dev y beta interna). Solo inicia sesión:
 * no hay registro con contraseña. Además del dominio @prueba.chilena, exige la marca de `app_metadata`
 * que pone la API de administración, así una cuenta creada por fuera no entra por aquí.
 */
export async function entrarConCuentaDePrueba(
  _previo: EstadoCuentaDePrueba,
  formData: FormData,
): Promise<EstadoCuentaDePrueba> {
  if (!(await isEnabled("auth.demo_login")))
    return { estado: "error", mensaje: MENSAJE_ERROR_ENTRADA.PRUEBA_APAGADA };
  const datos = cuentaDePruebaSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  if (!datos.success) {
    return { estado: "error", mensaje: datos.error.issues[0]?.message ?? MENSAJE_ERROR_ENTRADA.FALLA };
  }
  const { email, password, next } = datos.data;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    const tipo = errorDeSupabase(error);
    logger.warn("entrar con cuenta de prueba falló", { code: error?.code, status: error?.status });
    return {
      estado: "error",
      mensaje: MENSAJE_ERROR_ENTRADA[tipo === "MUCHOS_INTENTOS" ? tipo : "CREDENCIALES"],
      email,
    };
  }
  if (!esCuentaDePrueba(data.user.app_metadata)) {
    await supabase.auth.signOut();
    return { estado: "error", mensaje: MENSAJE_ERROR_ENTRADA.CREDENCIALES, email };
  }
  const { usuario } = await asegurarUsuario(data.user);
  redirect(destinoTrasEntrar(usuario, next));
}

/** Cambiar de rol (pantalla 24): solo a un rol que la persona tiene. No toca nada más. */
export async function cambiarRol(rol: Rol) {
  const usuario = await getCurrentUser();
  if (!usuario) redirect("/entrar");
  if (!ROLES.includes(rol)) return;
  const roleType = roleTypeDesdeRol(rol);
  if (!usuario.roles.some((r) => r.role === roleType)) return;
  if (usuario.activeRole !== roleType) {
    await db.user.update({ where: { id: usuario.id }, data: { activeRole: roleType } });
  }
  // El header (selector y acento) vive en el layout, que Next conserva al navegar: hay que refrescarlo
  refresh();
  redirect("/inicio");
}

/** Cerrar sesión */
export async function salir() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
