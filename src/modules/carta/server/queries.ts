import "server-only";
import { db } from "@/shared/lib/db";

/** Catálogo de insignias activas (lo carga la semilla desde `badges.catalog.ts`) */
export function catalogoDeInsignias() {
  return db.badge.findMany({
    where: { active: true },
    orderBy: [{ orden: "asc" }, { code: "asc" }],
    select: { id: true, code: true, categoria: true, nombre: true, descripcion: true, icon: true, repetible: true, criteria: true },
  });
}

/** La carta guardada de un jugador (la llena `recalcularCartas` al validar cada partido) */
export function cartaGuardada(userId: string) {
  return db.playerCard.findUnique({
    where: { userId },
    select: {
      positionGroup: true,
      tier: true,
      media: true,
      enConstruccion: true,
      partidosValidados: true,
      atributos: true,
      goles: true,
      partidos: true,
      asistencias: true,
      deltaUltimaJornada: true,
      recalculadaAt: true,
    },
  });
}

/** Las insignias guardadas de un jugador: ganadas (veces > 0) y las que lleva en progreso */
export function insigniasGuardadas(userId: string) {
  return db.userBadge.findMany({
    where: { userId },
    select: { veces: true, progreso: true, meta: true, badge: { select: { code: true } } },
  });
}

/** Rareza: % de los jugadores dados que tienen cada insignia (pantalla 28: "41% la tiene") */
export async function rarezaEntre(userIds: string[]): Promise<Map<string, number>> {
  if (!userIds.length) return new Map();
  const [conteos, insignias] = await Promise.all([
    db.userBadge.groupBy({ by: ["badgeId"], where: { userId: { in: userIds }, veces: { gt: 0 } }, _count: { _all: true } }),
    db.badge.findMany({ select: { id: true, code: true } }),
  ]);
  const code = new Map(insignias.map((b) => [b.id, b.code]));
  return new Map(
    conteos.map((c) => [code.get(c.badgeId)!, Math.max(1, Math.round((c._count._all / userIds.length) * 100))]),
  );
}
