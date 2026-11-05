import { NextResponse, type NextRequest } from "next/server";
import { runPendingJobs } from "@/modules/plataforma/server-api";

// Jobs (docs/NOTIFICACIONES.md §3). pg_cron llama `trabajos`, `recordatorios`, `votaciones`;
// Vercel Cron (vercel.json) llama `lunes` y `nocturno`. Todos con Authorization: Bearer CRON_SECRET.
const JOBS: Record<string, () => Promise<unknown>> = {
  trabajos: () => runPendingJobs(),
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
  const result = await run();
  return NextResponse.json({ ok: true, job, result });
}
