import { NextResponse, type NextRequest } from "next/server";
import { recalcularCartas } from "@/modules/carta/server-api";
import { jugadoresDeTorneosVigentes } from "@/modules/ligas/server-api";
import { partidosValidadosVigentes } from "@/modules/partidos/server-api";
import { runPendingJobs } from "@/modules/plataforma/server-api";
import { publicarPartido } from "@/modules/social/server-api";
import { logger } from "@/shared/lib/logger";

// El llenado inicial puede tardar (todas las cartas y los posts de cada partido validado)
export const maxDuration = 300;

/**
 * Recalcula y GUARDA todo lo que sale de lo validado: cartas e insignias de todos los jugadores y los
 * auto-posts de cada partido (y su fin de jornada). En silencio: no avisa ni anuncia lo que ya pasó.
 * Se corre después de cargar la semilla: `node scripts/supabase-dev.mjs recalcular`.
 */
async function recalcularTodo() {
  const cartas = await recalcularCartas(await jugadoresDeTorneosVigentes(), { silencioso: true });
  const partidos = await partidosValidadosVigentes();
  let posts = 0;
  for (const id of partidos) posts += (await publicarPartido(id))?.nuevos ?? 0;
  return { ...cartas, partidos: partidos.length, posts };
}

// Jobs (docs/NOTIFICACIONES.md §3). pg_cron llama `trabajos`, `recordatorios`, `votaciones`;
// Vercel Cron (vercel.json) llama `lunes` y `nocturno`. Todos con Authorization: Bearer CRON_SECRET.
const JOBS: Record<string, () => Promise<unknown>> = {
  trabajos: () => runPendingJobs(),
  recalcular: recalcularTodo,
  // Fase S2 / S3 / S4: implementar
  // recordatorios: ..., votaciones: ..., lunes: ..., nocturno: ...
};

export async function GET(request: NextRequest, ctx: RouteContext<"/api/cron/[job]">) {
  return handle(request, ctx);
}
export async function POST(request: NextRequest, ctx: RouteContext<"/api/cron/[job]">) {
  return handle(request, ctx);
}

async function handle(request: NextRequest, ctx: RouteContext<"/api/cron/[job]">) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { job } = await ctx.params;
  const run = JOBS[job];
  if (!run) return NextResponse.json({ error: `Job "${job}" pendiente de implementar` }, { status: 501 });
  try {
    const result = await run();
    return NextResponse.json({ ok: true, job, result });
  } catch (error) {
    // Solo llega aquí quien trae el CRON_SECRET: el detalle ayuda a depurar el job
    logger.error("cron falló", { job, error: String(error) });
    return NextResponse.json({ ok: false, job, error: String(error) }, { status: 500 });
  }
}
