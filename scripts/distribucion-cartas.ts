// Distribución de las cartas de la liga demo (docs/CARTA_E_INSIGNIAS.md §1.5): media por jugador con la
// fórmula real y cuántos caen en cada nivel, más los percentiles para ajustar los cortes.
//   npx tsx scripts/distribucion-cartas.ts
// Solo lee. Carga .env.local por dentro y nunca imprime secretos.
import { existsSync, readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { parse } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { calcularCarta, grupoDePosicion, NIVELES, nivelDeCarta } from "../src/modules/carta/server/formula";
import { armarHistoriales, posicionMasJugada, ventanaDe } from "../src/modules/carta/server/services/historial";

const env = existsSync(".env.local") ? parse(readFileSync(".env.local")) : {};
if (!env.DIRECT_URL) throw new Error("Falta DIRECT_URL en .env.local");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DIRECT_URL }) });

async function main() {
  const rosters = await db.tournamentRoster.findMany({
    where: { status: { in: ["ACTIVO", "SUSPENDIDO"] }, tournament: { status: { in: ["EN_CURSO", "LIGUILLA"] } } },
    select: { userId: true, tournamentId: true, tournamentTeam: { select: { teamId: true } } },
  });
  const plantillas = rosters.map((r) => ({ userId: r.userId, tournamentId: r.tournamentId, teamId: r.tournamentTeam.teamId }));
  const userIds = [...new Set(plantillas.map((p) => p.userId))];
  const partidos = await db.match.findMany({
    where: { status: "VALIDADO", tournamentId: { in: [...new Set(plantillas.map((p) => p.tournamentId))] } },
    orderBy: { scheduledAt: "asc" },
    select: { id: true, tournamentId: true, scheduledAt: true, homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
  });
  const matchIds = partidos.map((p) => p.id);
  const [alineaciones, eventos, suspensiones, perfiles] = await Promise.all([
    db.lineupPlayer.findMany({
      where: { userId: { in: userIds }, lineup: { matchId: { in: matchIds } } },
      select: { userId: true, jugo: true, titular: true, posicion: true, lineup: { select: { matchId: true, teamId: true } } },
    }),
    db.matchEvent.findMany({
      where: { matchId: { in: matchIds }, oficial: true, voided: false, type: { in: ["GOL", "PENAL_ATAJADO", "AMARILLA", "ROJA"] } },
      select: { matchId: true, type: true, minute: true, tipoGol: true, teamId: true, playerId: true, assistPlayerId: true },
    }),
    db.sanction.findMany({
      where: { userId: { in: userIds }, type: "SUSPENSION_PARTIDOS", status: { not: "ANULADA" }, matchId: { not: null } },
      select: { userId: true, matchId: true, partidos: true },
    }),
    db.playerProfile.findMany({ where: { userId: { in: userIds } }, select: { userId: true, posicionPrincipal: true } }),
  ]);
  const historiales = armarHistoriales(plantillas, { partidos, alineaciones, eventos, suspensiones });
  const posicion = new Map(perfiles.map((p) => [p.userId, p.posicionPrincipal]));

  const cartas = userIds.map((id) => {
    const h = historiales.get(id) ?? [];
    const jugados = h.filter((p) => p.jugo).length;
    return calcularCarta(ventanaDe(h), grupoDePosicion(posicion.get(id), posicionMasJugada(h)), jugados);
  });
  const conMedia = cartas.filter((c) => c.media != null).map((c) => c.media!).sort((a, b) => a - b);
  const pct = (p: number) => conMedia[Math.min(conMedia.length - 1, Math.floor((p / 100) * conMedia.length))];

  console.log(`Jugadores: ${cartas.length} · con media: ${conMedia.length} · en construcción: ${cartas.length - conMedia.length}`);
  console.log(`Media: mín ${conMedia[0]} · máx ${conMedia.at(-1)} · P50 ${pct(50)} · P80 ${pct(80)} · P95 ${pct(95)}`);
  console.log(`Partidos validados: máx ${Math.max(...cartas.map((c) => c.partidosValidados))} (Leyenda pide ${NIVELES.leyendaPartidos})`);
  const conteo = new Map<string, number>();
  for (const c of cartas) conteo.set(c.nivel, (conteo.get(c.nivel) ?? 0) + 1);
  console.log("\nNivel      Jugadores   %");
  for (const n of ["bronce", "plata", "oro", "leyenda"]) {
    const k = conteo.get(n) ?? 0;
    console.log(`${n.padEnd(10)} ${String(k).padStart(9)}   ${((k / cartas.length) * 100).toFixed(0)}%`);
  }
  // Cuántos caerían con cada corte posible (para elegir)
  console.log("\nMedias (de menor a mayor):", conMedia.join(" "));
  // Para contrastar: los niveles por la media sola, sin el requisito de partidos de la Leyenda
  console.log(`\nCon los cortes actuales y sin pedir partidos a la Leyenda: ${conMedia.filter((m) => nivelDeCarta(m, 99) === "leyenda").length} leyendas`);
}

main().finally(() => db.$disconnect());
