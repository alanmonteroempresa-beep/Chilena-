"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "./env";

/**
 * Cliente de Supabase en el navegador. SOLO para: iniciar sesión, subir el avatar
 * (con URL firmada del servidor) y escuchar canales Realtime Broadcast.
 * Nunca para leer o escribir datos de negocio (eso va por Prisma en el servidor).
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
}
