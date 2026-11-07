import { NextResponse, type NextRequest } from "next/server";
import { recalcularCartas } from "@/modules/carta/server-api";
import { reiniciarPaseDeLista } from "@/modules/equipos/server-api";
import { jugadoresDelPartido, jugadoresDeTorneosVigentes, recalcularTabla, torneosVigentes } from "@/modules/ligas/server-api";
import {
  partidosValidadosVigentes,
  recalcularEstadisticas,
  recalcularSancionesDelTorneo,
  reiniciarPartidoDePrueba,
} from "@/modules/partidos/server-api";
import { mandarRecordatorios, olvidarRecordatorios } from "@/modules/notificaciones/server-api";
import { runPendingJobs } from "@/modules/plataforma/server-api";
import { borrarPostsDelPartido, publicarPartido } from "@/modules/social/server-api";
import { cerrarVencidas, reiniciarVotacionesDelPartido } from "@/modules/votaciones/server-api";
import { asegurarListeners } from "@/shared/events/bus";
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

/**
 * Recalcula desde lo validado la tabla, las estadísticas y las sanciones de los torneos vigentes. Con
 * `?seco=1` solo cuenta qué cambiaría (sirve para comprobar que lo guardado cuadra con las cédulas).
 */
async function recalcularTorneos(params: URLSearchParams) {
  const seco = params.get("seco") === "1";
  // Las búsquedas entre módulos (quién está inscrito) se registran con los listeners
  await asegurarListeners();
  const resultado = [];
  for (const t of await torneosVigentes()) {
    const sanciones = await recalcularSancionesDelTorneo(t, { seco });
    resultado.push({
      torneo: t.nombre,
      tabla: await recalcularTabla(t.id, { seco }),
      estadisticas: await recalcularEstadisticas(t.id, { seco }),
      sanciones: { nuevas: sanciones.creadas.map((s) => s.motivo), anuladas: sanciones.anuladas, cumplidos: sanciones.cambios.length },
    });
  }
  return { seco, resultado };
}

/**
 * Regresa el partido de prueba (J16 Portales vs Tigres) a "sin jugar" y deja todo como si nunca se hubiera
 * jugado: sanciones, estadísticas, tabla, votación del MVP, posts y cartas. `?todo=1`: además el pase de lista en blanco y el
 * partido hoy a las 20:00 (o mañana, si ya pasó; `&hora=12:00` cambia la hora y `&fecha=2026-11-08` el día). Lo llama `npx tsx scripts/reiniciar-prueba.ts [url] [--todo]`.
 */
async function reiniciarPrueba(params: URLSearchParams) {
  await asegurarListeners();
  const todo = params.get("todo") === "1";
  const r = await reiniciarPartidoDePrueba({ todo, hora: params.get("hora") ?? undefined, fecha: params.get("fecha") ?? undefined });
  const paseDeLista = todo ? await reiniciarPaseDeLista(r.matchId) : null;
  const votaciones = await reiniciarVotacionesDelPartido(r.matchId);
  const recordatorios = await olvidarRecordatorios(r.matchId);
  if (!r.tournamentId) return { ...r, paseDeLista, votaciones, recordatorios };
  const jugadores = await jugadoresDelPartido(r.matchId);
  const tabla = await recalcularTabla(r.tournamentId);
  const posts = await borrarPostsDelPartido(r.matchId, { desde: r.validadoEn, userIds: jugadores });
  const cartas = await recalcularCartas(jugadores, { silencioso: true });
  return { ...r, paseDeLista, votaciones, recordatorios, tabla, posts, cartas };
}

// Jobs (docs/NOTIFICACIONES.md §3). pg_cron llama `trabajos`, `recordatorios`, `votaciones`;
// Vercel Cron (vercel.json) llama `lunes` y `nocturno`. Todos con Authorization: Bearer CRON_SECRET.
const JOBS: Record<string, (params: URLSearchParams) => Promise<unknown>> = {
  // Cada minuto (pg_cron): la cola y "Te toca jugar" (1 h antes del partido)
  trabajos: async () => ({ cola: await runPendingJobs(), recordatorios: await mandarRecordatorios() }),
  recalcular: recalcularTodo,
  "recalcular-torneo": recalcularTorneos,
  "reiniciar-prueba": reiniciarPrueba,
  // Las votaciones cierran solas con la cola (`votacion.cerrar`); esto cierra las vencidas que se quedaran
  votaciones: () => cerrarVencidas(),
  // Fase S2 / S3 / S4: implementar
  // recordatorios: ..., lunes: ..., nocturno: ...
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
    const result = await run(request.nextUrl.searchParams);
    return NextResponse.json({ ok: true, job, result });
  } catch (error) {
    // Solo llega aquí quien trae el CRON_SECRET: el detalle ayuda a depurar el job
    logger.error("cron falló", { job, error: String(error) });
    return NextResponse.json({ ok: false, job, error: String(error) }, { status: 500 });
  }
}
