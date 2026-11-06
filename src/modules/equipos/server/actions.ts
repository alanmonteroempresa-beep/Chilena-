"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { assertCan, DomainError, NotFoundError } from "@/modules/core";
import { getCurrentUser } from "@/modules/core/server-api";
import { assertAlineacionValida, horarioCorto } from "@/modules/partidos";
import { partidoDelDia } from "@/modules/partidos/server-api";
import { asegurarListeners, emit } from "@/shared/events/bus";
import { db } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";
import { nombreCorto } from "@/shared/lib/personas";
import { abrirPaseDeListaSchema, alineacionSchema, contestarPorLinkSchema, contestarSchema } from "../schemas";
import { revisionDeAlineacion } from "./alineacion";
import { plantillaDelEquipo } from "./queries";

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const URL_APP = (process.env.NEXT_PUBLIC_APP_URL ?? "https://chilena.vercel.app").replace(/\/$/, "");
/** Hasta cuándo se puede contestar o cambiar la alineación: antes de que el árbitro mande la cédula */
const ABIERTO = ["PROGRAMADO", "EN_JUEGO"];

async function quien() {
  const usuario = await getCurrentUser();
  if (!usuario) throw new DomainError("Entra para hacer esto.", "SIN_SESION");
  await asegurarListeners();
  return usuario;
}

function fallo(error: unknown): { ok: false; error: string } {
  if (error instanceof DomainError) return { ok: false, error: error.message };
  if (error instanceof Error && "issues" in error) return { ok: false, error: (error as { issues: { message: string }[] }).issues[0]?.message ?? "Revisa los datos." };
  logger.error("acción de equipos falló", { error: String(error) });
  return { ok: false, error: "Se fue la señal en la cancha. Intenta otra vez." };
}

async function partidoAbierto(matchId: string) {
  const p = await partidoDelDia(matchId);
  if (!p) throw new NotFoundError("No encontramos ese partido.");
  if (!ABIERTO.includes(p.status) || (p.report && p.report.status !== "BORRADOR"))
    throw new DomainError("Ese partido ya cerró: el árbitro mandó la cédula.");
  return p;
}

async function guardarRespuesta(matchId: string, teamId: string, userId: string, respuesta: "VA" | "NO_VA", channel: "APP" | "LINK") {
  await db.matchAttendance.upsert({
    where: { matchId_userId: { matchId, userId } },
    create: { matchId, userId, teamId, status: respuesta, channel, respondedAt: new Date() },
    update: { status: respuesta, channel, respondedAt: new Date() },
  });
  await emit("attendance.responded", { matchId, userId, status: respuesta });
}

/** VOY / NO VOY desde la app (pantalla 03): cada quien por sí mismo */
export async function contestarPaseDeLista(entrada: unknown): Promise<Resultado<{ respuesta: string }>> {
  try {
    const { matchId, respuesta } = contestarSchema.parse(entrada);
    const usuario = await quien();
    const p = await partidoAbierto(matchId);
    const miembro = await db.teamMember.findFirst({
      where: { userId: usuario.id, status: "ACTIVO", teamId: { in: [p.homeTeam.id, p.awayTeam.id] } },
      select: { teamId: true },
    });
    if (!miembro) throw new DomainError("No estás en ninguno de los dos equipos.");
    await assertCan(usuario.id, "attendance.respond", { teamId: miembro.teamId, targetUserId: usuario.id });
    await guardarRespuesta(matchId, miembro.teamId, usuario.id, respuesta, "APP");
    refresh();
    return { ok: true, respuesta };
  } catch (e) {
    return fallo(e);
  }
}

/** VOY / NO VOY desde el link de WhatsApp (pantalla 20): sin cuenta, eligiendo su nombre (PRD §7.6) */
export async function contestarPorLink(entrada: unknown): Promise<Resultado<{ respuesta: string }>> {
  try {
    const { token, userId, respuesta } = contestarPorLinkSchema.parse(entrada);
    const link = await db.attendanceLink.findUnique({ where: { token }, select: { matchId: true, teamId: true, expiresAt: true } });
    if (!link || link.expiresAt < new Date()) throw new DomainError("Ese link ya venció. Pídele uno nuevo a tu delegado.");
    await partidoAbierto(link.matchId);
    const miembro = await db.teamMember.count({ where: { userId, teamId: link.teamId, status: "ACTIVO" } });
    if (!miembro) throw new DomainError("Ese nombre no está en la plantilla.");
    await asegurarListeners();
    await guardarRespuesta(link.matchId, link.teamId, userId, respuesta, "LINK");
    refresh();
    return { ok: true, respuesta };
  } catch (e) {
    return fallo(e);
  }
}

/**
 * El delegado abre el pase de lista (pantallas 04 y 20): un link por partido y equipo para el grupo de
 * WhatsApp. La primera vez avisa a la plantilla. Devuelve el texto listo para compartir.
 */
export async function abrirPaseDeLista(entrada: unknown): Promise<Resultado<{ url: string; texto: string }>> {
  try {
    const { matchId, teamId } = abrirPaseDeListaSchema.parse(entrada);
    const usuario = await quien();
    await assertCan(usuario.id, "attendance.sendLink", { teamId });
    const p = await partidoAbierto(matchId);
    if (p.homeTeam.id !== teamId && p.awayTeam.id !== teamId) throw new DomainError("Ese equipo no juega este partido.");
    const previo = await db.attendanceLink.findUnique({ where: { matchId_teamId: { matchId, teamId } }, select: { token: true } });
    const vence = new Date((p.scheduledAt?.getTime() ?? Date.now()) + 6 * 3_600_000);
    const token = previo?.token ?? randomBytes(9).toString("base64url");
    if (!previo) await db.attendanceLink.create({ data: { token, matchId, teamId, expiresAt: vence } });
    else await db.attendanceLink.update({ where: { token }, data: { expiresAt: vence } });
    const plantilla = await plantillaDelEquipo(teamId);
    await db.matchAttendance.createMany({
      data: plantilla.map((m) => ({ matchId, userId: m.user.id, teamId, status: "CONVOCADO" as const })),
      skipDuplicates: true,
    });
    if (!previo) await emit("attendance.link_opened", { matchId, teamId, byUserId: usuario.id });
    const rival = p.homeTeam.id === teamId ? p.awayTeam : p.homeTeam;
    const url = `${URL_APP}/p/${token}`;
    const cuando = p.scheduledAt ? horarioCorto(p.scheduledAt, p.field?.nombre) : "";
    const texto = `⚽ Pase de lista vs ${nombreCorto(rival.nombre)} · ${cuando}. Piquen y digan si van 👇 ${url}`;
    return { ok: true, url, texto };
  } catch (e) {
    return fallo(e);
  }
}

/** La alineación (pantalla 53 · PRD §7.6): el servidor no guarda una con alguien en rojo */
export async function guardarAlineacion(entrada: unknown): Promise<Resultado> {
  try {
    const { matchId, teamId, jugadores } = alineacionSchema.parse(entrada);
    const usuario = await quien();
    await assertCan(usuario.id, "lineup.submit", { teamId });
    const p = await partidoAbierto(matchId);
    if (p.homeTeam.id !== teamId && p.awayTeam.id !== teamId) throw new DomainError("Ese equipo no juega este partido.");
    const { jugadores: plantilla, revision } = await revisionDeAlineacion(teamId, p.tournamentId);
    const elegidos = new Set(jugadores.map((j) => j.userId));
    const fuera = jugadores.find((j) => !plantilla.some((x) => x.userId === j.userId));
    if (fuera) throw new DomainError("Hay alguien que no está en tu plantilla.");
    const deLosElegidos = { ...revision, bloqueados: revision.bloqueados.filter((r) => elegidos.has(r.userId)) };
    assertAlineacionValida(deLosElegidos);
    const alertas = revision.porJugador.filter((r) => elegidos.has(r.userId) && r.alertas.length) as unknown as Prisma.InputJsonValue;
    await db.$transaction(async (tx) => {
      const lineup = await tx.lineup.upsert({
        where: { matchId_teamId: { matchId, teamId } },
        create: { matchId, teamId, submittedById: usuario.id, alerts: alertas },
        update: { submittedById: usuario.id, submittedAt: new Date(), alerts: alertas },
        select: { id: true },
      });
      await tx.lineupPlayer.deleteMany({ where: { lineupId: lineup.id } });
      await tx.lineupPlayer.createMany({
        data: jugadores.map((j) => ({
          lineupId: lineup.id,
          userId: j.userId,
          titular: j.titular,
          numero: j.numero,
          capitan: j.capitan,
          posicion: (plantilla.find((x) => x.userId === j.userId)?.posicion ?? null) as Prisma.LineupPlayerCreateManyInput["posicion"],
        })),
      });
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fallo(e);
  }
}
