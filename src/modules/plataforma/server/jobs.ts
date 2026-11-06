import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { asegurarListeners } from "@/shared/events/bus";
import { db } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";

/**
 * Cola de trabajos en segundo plano (tabla `jobs`). La procesa /api/cron/trabajos
 * cada minuto vía pg_cron (docs/SETUP.md §4). Los módulos registran handlers con
 * `registerJobHandler("card.recalculate", fn)` desde su registerListeners().
 */
type JobHandler = (payload: Prisma.JsonValue) => Promise<void>;
const jobHandlers = new Map<string, JobHandler>();

export function registerJobHandler(type: string, handler: JobHandler) {
  jobHandlers.set(type, handler);
}

export async function enqueueJob(type: string, payload: Prisma.InputJsonValue, opts?: { dedupeKey?: string; runAt?: Date }) {
  if (opts?.dedupeKey) {
    await db.job.upsert({
      where: { dedupeKey: opts.dedupeKey },
      create: { type, payload, dedupeKey: opts.dedupeKey, runAt: opts.runAt },
      update: {},
    });
    return;
  }
  await db.job.create({ data: { type, payload, runAt: opts?.runAt } });
}

const MAX_ATTEMPTS = 5;

export async function runPendingJobs(limit = 25) {
  // Los handlers se registran en registerListeners(): en el cron nadie ha emitido todavía
  await asegurarListeners();
  const jobs = await db.job.findMany({
    where: { status: "PENDIENTE", runAt: { lte: new Date() } },
    orderBy: { runAt: "asc" },
    take: limit,
  });
  let done = 0;
  for (const job of jobs) {
    const claimed = await db.job.updateMany({
      where: { id: job.id, status: "PENDIENTE" },
      data: { status: "CORRIENDO", attempts: { increment: 1 } },
    });
    if (claimed.count === 0) continue; // otro proceso lo tomó
    const handler = jobHandlers.get(job.type);
    try {
      if (!handler) throw new Error(`Sin handler para ${job.type}`);
      await handler(job.payload);
      await db.job.update({ where: { id: job.id }, data: { status: "HECHO", finishedAt: new Date() } });
      done++;
    } catch (error) {
      const failed = job.attempts + 1 >= MAX_ATTEMPTS;
      await db.job.update({
        where: { id: job.id },
        data: {
          status: failed ? "FALLIDO" : "PENDIENTE",
          lastError: String(error),
          runAt: new Date(Date.now() + 60_000 * (job.attempts + 1)),
        },
      });
      logger.error("job falló", { id: job.id, type: job.type, error: String(error) });
    }
  }
  return { processed: jobs.length, done };
}

/**
 * Corre la cola hasta vaciarla (máximo `vueltas`): lo usa `after()` al validar un partido para que la
 * carta, las insignias y el feed salgan al momento, sin esperar al cron. Un trabajo puede encolar otro
 * (la insignia ganada encola su post), por eso da varias vueltas.
 */
export async function procesarCola(vueltas = 4) {
  let total = 0;
  for (let i = 0; i < vueltas; i++) {
    const { processed } = await runPendingJobs(50);
    total += processed;
    if (processed === 0) break;
  }
  return total;
}
