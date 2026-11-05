import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "./env";

/** Cliente de Supabase para Server Components, Server Actions y Route Handlers (solo Auth/Storage/Realtime). */
export async function createSupabaseServerClient() {
  // cacheComponents + partialPrefetching: el prefetch puede prerenderizar con cookies, y auth-js usa
  // Date.now() al cargar la sesión. connection() deja la sesión solo para la petición real.
  await connection();
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component: el refresco de sesión lo hace src/proxy.ts.
        }
      },
    },
  });
}
