import "server-only";
import { db } from "@/shared/lib/db";

const ACTIVOS = ["INSCRIPCIONES_ABIERTAS", "EN_CURSO", "LIGUILLA"] as const;
const ligaSelect = { id: true, slug: true, nombre: true, siglas: true } as const;

/** Ligas que la persona administra o donde arbitra (selector de rol · pantallas 07 y 24) */
export async function contextosEnLigas(userId: string) {
  const [administra, arbitra] = await Promise.all([
    db.leagueAdmin.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        league: {
          select: {
            ...ligaSelect,
            tournaments: {
              where: { status: { in: [...ACTIVOS] } },
              take: 1,
              select: { nombre: true },
            },
          },
        },
      },
    }),
    db.leagueReferee.findMany({
      where: { userId, status: "ACTIVO" },
      orderBy: { createdAt: "asc" },
      select: { league: { select: ligaSelect } },
    }),
  ]);
  return { administra, arbitra };
}
