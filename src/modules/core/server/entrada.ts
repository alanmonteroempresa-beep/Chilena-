import "server-only";
import type { EmailOtpType, User as AuthUser } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { emit } from "@/shared/events/bus";
import { db } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import {
  candidatosUsername,
  destinoTrasEntrar,
  errorDeSupabase,
  nombreDesdeAuth,
  rutaSegura,
  usernameBase,
  type ErrorDeEntrada,
} from "./services/sesion";

const seleccion = { id: true, nombre: true, sobrenombre: true, username: true } as const;
type PersonaQueEntra = Prisma.UserGetPayload<{ select: typeof seleccion }>;

const esUnico = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

/**
 * La persona de Chilena de esta sesión. Si es su primera vez, la crea como aficionado (PRD §4.1).
 * Perfiles sin reclamar (CLAUDE.md): si un perfil sin `authId` ya tiene este mismo correo, que la persona
 * acaba de comprobar con el link, se liga a esa cuenta en lugar de duplicar a la persona.
 */
export async function asegurarUsuario(auth: AuthUser): Promise<{ usuario: PersonaQueEntra; nuevo: boolean }> {
  const ya = await db.user.findUnique({ where: { authId: auth.id }, select: seleccion });
  if (ya) return { usuario: ya, nuevo: false };

  const email = auth.email?.trim().toLowerCase() || null;
  const conCorreo = email
    ? await db.user.findUnique({ where: { email }, select: { ...seleccion, authId: true } })
    : null;
  {
    if (conCorreo && !conCorreo.authId) {
      const ligado = await db.user.update({
        where: { id: conCorreo.id },
        data: { authId: auth.id, claimedAt: new Date() },
        select: seleccion,
      });
      await emit("user.claimed", { userId: ligado.id });
      return { usuario: ligado, nuevo: false };
    }
  }

  const { nombre, apellidos } = nombreDesdeAuth(auth.user_metadata);
  for (const username of candidatosUsername(usernameBase(nombre, email))) {
    try {
      const usuario = await db.user.create({
        data: {
          authId: auth.id,
          // Un correo que ya usa otra cuenta no se repite: se guarda sin correo y la persona sí entra
          email: conCorreo ? null : email,
          username,
          nombre,
          apellidos,
          claimedAt: new Date(),
          activeRole: "AFICIONADO",
          roles: { create: { role: "AFICIONADO" } },
        },
        select: seleccion,
      });
      return { usuario, nuevo: true };
    } catch (e) {
      if (!esUnico(e)) throw e;
      // Dos pestañas a la vez: la otra ya la creó
      const otra = await db.user.findUnique({ where: { authId: auth.id }, select: seleccion });
      if (otra) return { usuario: otra, nuevo: false };
      // Si no, el username ya estaba tomado: sigue con el siguiente candidato
    }
  }
  throw new Error("No se pudo crear el username");
}

function aEntrar(request: NextRequest, error: ErrorDeEntrada | null, next: string | null) {
  const url = new URL("/entrar", request.url);
  if (error) url.searchParams.set("error", error);
  if (next) url.searchParams.set("next", next);
  return sinCache(NextResponse.redirect(url));
}

/** Las respuestas que abren sesión nunca se guardan en la CDN (docs de Supabase, guía avanzada de SSR) */
function sinCache(r: NextResponse) {
  r.headers.set("Cache-Control", "private, no-store");
  return r;
}

/**
 * GET /auth/confirm — link mágico (`token_hash` + `type`, plantilla del correo) o código PKCE
 * (`code`, Google o la plantilla por defecto). Abre la sesión, asegura su `User` y lo manda a su destino.
 * Sin parámetros, solo revisa la sesión que ya tiene (así lo usa `proxy.ts`).
 */
export async function confirmarEntrada(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const next = rutaSegura(params.get("next"));
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");
  const supabase = await createSupabaseServerClient();

  if (params.get("error_code")) {
    // Supabase regresa con ?error_code=otp_expired cuando el link ya no sirve
    return aEntrar(request, errorDeSupabase({ code: params.get("error_code") ?? undefined }), next);
  }
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      logger.warn("verifyOtp falló", { code: error.code, status: error.status });
      return aEntrar(
        request,
        errorDeSupabase(error) === "FALLA" ? "LINK_VENCIDO" : errorDeSupabase(error),
        next,
      );
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logger.warn("exchangeCodeForSession falló", { code: error.code, status: error.status });
      return aEntrar(request, "LINK_VENCIDO", next);
    }
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) return aEntrar(request, tokenHash || code ? "SIN_SESION" : null, next);

  try {
    const { usuario, nuevo } = await asegurarUsuario(data.user);
    if (nuevo) logger.info("persona nueva", { userId: usuario.id });
    return sinCache(NextResponse.redirect(new URL(destinoTrasEntrar(usuario, next), request.url)));
  } catch (e) {
    logger.error("no se pudo asegurar el User", { error: String(e) });
    return aEntrar(request, "FALLA", next);
  }
}
