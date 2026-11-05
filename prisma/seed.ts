// Semilla de Chilena. `pnpm prisma db seed`
// - Siempre: feature flags e insignias.
// - SEED_DEMO=1: liga demo del deck (prisma/demo/, docs/ROADMAP.md Fase 0).
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { FLAG_DEFAULTS } from "../src/modules/core/flags.defaults";
import { BADGES } from "../src/modules/carta/badges.catalog";
import { cargarLigaDemo } from "./demo/cargar";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }),
});

async function main() {
  for (const [key, { enabled, descripcion }] of Object.entries(FLAG_DEFAULTS)) {
    // No pisa un flag que alguien ya cambió a mano.
    await db.featureFlag.upsert({
      where: { key },
      create: { key, enabled, descripcion },
      update: { descripcion },
    });
  }

  for (const [orden, b] of BADGES.entries()) {
    await db.badge.upsert({
      where: { code: b.code },
      create: { ...b, orden },
      update: {
        nombre: b.nombre,
        descripcion: b.descripcion,
        icon: b.icon,
        repetible: b.repetible,
        criteria: b.criteria,
        categoria: b.categoria,
        orden,
      },
    });
  }

  if (process.env.SEED_DEMO === "1") {
    // Liga Dominical Iztapalapa · Apertura 2026 (prisma/demo/). Solo en chilena-dev.
    // SEED_HOY=2026-10-12 reproduce las fechas exactas del deck; sin él, la J16 es el próximo domingo.
    const hoy = process.env.SEED_HOY ? new Date(`${process.env.SEED_HOY}T12:00:00-06:00`) : new Date();
    const plan = await cargarLigaDemo(db, { hoy });
    console.info(
      `SEED_DEMO: ${plan.league.nombre} · ${plan.tournament.nombre} · J15 el ${plan.claves.fechaJ15} · ` +
        `${plan.teams.length} equipos · ${plan.users.length} personas · ${plan.matches.length} partidos · ` +
        `${plan.matchEvents.length} eventos`,
    );
    console.table(plan.resumen.tabla);
    console.table(plan.resumen.goleo);
  }

  console.info(`Semilla lista: ${Object.keys(FLAG_DEFAULTS).length} flags, ${BADGES.length} insignias`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
