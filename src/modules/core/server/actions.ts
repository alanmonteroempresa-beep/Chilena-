"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logger } from "@/shared/lib/logger";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { entrarSchema } from "../schemas";
import { isEnabled } from "./flags";
import { errorDeSupabase, MENSAJE_ERROR_ENTRADA, rutaSegura } from "./services/sesion";

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

/** Cerrar sesión */
export async function salir() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
