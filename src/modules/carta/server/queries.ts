import "server-only";
import { db } from "@/shared/lib/db";

/** Catálogo de insignias activas (lo carga la semilla desde `badges.catalog.ts`) */
export function catalogoDeInsignias() {
  return db.badge.findMany({
    where: { active: true },
    orderBy: [{ orden: "asc" }, { code: "asc" }],
    select: { code: true, categoria: true, nombre: true, descripcion: true, icon: true, repetible: true, criteria: true },
  });
}
