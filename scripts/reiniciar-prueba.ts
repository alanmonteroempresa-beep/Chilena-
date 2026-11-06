// Regresa el partido de prueba (J16 · Dep. Portales vs Tigres del Llano) a "sin jugar" en chilena-dev:
// borra su cédula, correcciones, eventos, alineaciones y marcador en vivo, y lo deja PROGRAMADO.
// Lo usan los E2E de la cédula al terminar y sirve para volver a jugarlo de principio a fin.
//   npx tsx scripts/reiniciar-prueba.ts            # solo la cédula y el resultado
//   npx tsx scripts/reiniciar-prueba.ts --todo     # además, el pase de lista en blanco y el partido hoy a las 20:00
//   --forzar                                       # aunque la liga ya lo haya validado
// La bitácora (audit_logs) no se borra: queda el historial de cada prueba.
// Carga .env.local por dentro; nunca imprime secretos.
import { existsSync, readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { fromZonedTime } from "date-fns-tz";
import { parse } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";

const env = existsSync(".env.local") ? parse(readFileSync(".env.local")) : {};
if (!env.DIRECT_URL) {
  console.log("Sin DIRECT_URL: no hay base que reiniciar.");
  process.exit(0);
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DIRECT_URL }) });
const todo = process.argv.includes("--todo");
const forzar = process.argv.includes("--forzar");

async function main() {
  const m = await db.match.findFirst({
    where: { round: { numero: 16 }, homeTeam: { slug: "dep-portales" }, awayTeam: { slug: "tigres-del-llano" } },
    select: { id: true, status: true },
  });
  if (!m) throw new Error("No encontré la J16 Portales vs Tigres (¿cargaste la semilla demo?)");
  if (m.status === "VALIDADO" && !forzar) throw new Error("La liga ya lo validó: usa --forzar para regresarlo (y recalcula la tabla y las cartas).");

  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
  await db.$transaction(async (tx) => {
    await tx.matchReport.deleteMany({ where: { matchId: m.id } });
    await tx.matchEvent.deleteMany({ where: { matchId: m.id } });
    await tx.lineup.deleteMany({ where: { matchId: m.id } });
    await tx.liveScoreUpdate.deleteMany({ where: { matchId: m.id } });
    await tx.match.update({
      where: { id: m.id },
      data: {
        status: "PROGRAMADO",
        homeScore: null,
        awayScore: null,
        homePenalties: null,
        awayPenalties: null,
        winnerTeamId: null,
        liveHomeScore: 0,
        liveAwayScore: 0,
        liveMinute: null,
        liveUpdatedAt: null,
        startedAt: null,
        endedAt: null,
        validatedAt: null,
        validatedById: null,
        ...(todo ? { scheduledAt: fromZonedTime(`${hoy}T20:00:00`, "America/Mexico_City") } : {}),
      },
    });
    if (todo) {
      await tx.matchAttendance.updateMany({ where: { matchId: m.id }, data: { status: "CONVOCADO", respondedAt: null, nota: null } });
      await tx.attendanceLink.deleteMany({ where: { matchId: m.id } });
    }
  });
  console.log(`✓ J16 Portales vs Tigres otra vez sin jugar${todo ? ` (hoy ${hoy} a las 20:00, pase de lista en blanco)` : ""}`);
}
main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
