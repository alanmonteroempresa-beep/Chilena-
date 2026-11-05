// Semilla de Chilena. `pnpm prisma db seed`
// - Siempre: feature flags e insignias.
// - SEED_DEMO=1: liga demo del deck (Fase 0 — por implementar, ver docs/ROADMAP.md).
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { FLAG_DEFAULTS } from "../src/modules/core/flags.defaults";
import { BADGES } from "../src/modules/carta/badges.catalog";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }),
});

async function main() {
  for (const [key, { enabled, descripcion }] of Object.entries(FLAG_DEFAULTS)) {
    // No pisa un flag que alguien ya cambió a mano.
    await db.featureFlag.upsert({ where: { key }, create: { key, enabled, descripcion }, update: { descripcion } });
  }

  for (const [orden, b] of BADGES.entries()) {
    await db.badge.upsert({
      where: { code: b.code },
      create: { ...b, orden },
      update: { nombre: b.nombre, descripcion: b.descripcion, icon: b.icon, repetible: b.repetible, criteria: b.criteria, categoria: b.categoria, orden },
    });
  }

  if (process.env.SEED_DEMO === "1") {
    // TODO Fase 0: Liga Dominical Iztapalapa · Apertura 2026 · 8 equipos · 16 jugadores c/u ·
    // 3 árbitros · Deportivo Cuitláhuac (3 canchas) · 15 jornadas validadas con eventos realistas.
    // Datos y nombres: docs/ROADMAP.md (Fase 0) y docs/fuentes/Pelotazo_Pantallas.pptx.
    console.info("SEED_DEMO: pendiente de implementar (Fase 0)");
  }

  console.info(`Semilla lista: ${Object.keys(FLAG_DEFAULTS).length} flags, ${BADGES.length} insignias`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
