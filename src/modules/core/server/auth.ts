import "server-only";
import { db } from "@/shared/lib/db";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";

/** Persona de Chilena ligada a la sesión de Supabase (o null si no hay sesión / no ha reclamado perfil). */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return db.user.findUnique({
    where: { authId: data.user.id },
    include: { roles: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("NO_SESSION");
  return user;
}
