import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/shared/lib/supabase/env";

// Next 16: "middleware" ahora se llama "proxy". Refresca la sesión de Supabase en cada request
// y hace las redirecciones de sesión (pantalla 01). Las de rol y onboarding fino llegan en la Fase 1.

/** Rutas que piden sesión (el cascarón de la app: src/app/(app)) */
const PRIVADAS = [
  "/inicio",
  "/perfil",
  "/en-vivo",
  "/mi-liga",
  "/publicar",
  "/arbitro",
  "/admin",
  "/buscar",
  "/notificaciones",
];
/** /equipo/[slug] será público (pantalla 36); su gestión no */
const PRIVADA_DE_EQUIPO = /^\/equipo\/[^/]+\/(pase-de-lista|gestion|alineacion)(\/|$)/;
/** Con sesión no tiene caso verlas: /auth/confirm decide si va a Completa tu perfil o a su inicio */
const SOLO_SIN_SESION = ["/", "/entrar"];

const empiezaCon = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // @supabase/ssr ≥ 0.10: encabezados para que la CDN no guarde una respuesta con la sesión de alguien
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;

  if (!user && (PRIVADAS.some((p) => empiezaCon(pathname, p)) || PRIVADA_DE_EQUIPO.test(pathname))) {
    const destino = new URL("/entrar", request.url);
    destino.searchParams.set("next", `${pathname}${search}`);
    return redirigir(response, destino);
  }
  if (user && SOLO_SIN_SESION.includes(pathname)) {
    const destino = new URL("/auth/confirm", request.url);
    const next = request.nextUrl.searchParams.get("next");
    if (next) destino.searchParams.set("next", next);
    return redirigir(response, destino);
  }
  return response;
}

/** Redirige sin perder las cookies de sesión que Supabase acaba de refrescar */
function redirigir(response: NextResponse, destino: URL) {
  const r = NextResponse.redirect(destino);
  response.cookies.getAll().forEach((c) => r.cookies.set(c));
  r.headers.set("Cache-Control", "private, no-store");
  return r;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|api/og/|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
