"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { assertCan, can, DomainError, ForbiddenError, NotFoundError } from "@/modules/core";
import { getCurrentUser, personasPorId } from "@/modules/core/server-api";
import { procesarCola } from "@/modules/plataforma/server-api";
import { asegurarListeners, emit } from "@/shared/events/bus";
import { db } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";
import { nombreVisible } from "@/shared/lib/personas";
import { enviarCedulaSchema, firmarSchema, pedirCorreccionSchema, responderCorreccionSchema, validarListasSchema, validarSchema } from "../schemas";
import { inscritosDelPartido } from "./puertos";
import { sancionesActivas } from "./queries";
import { recalcularEstadisticas, recalcularSanciones } from "./recalcular";
import {
  aplicarCorreccion,
  marcadorDeLaCedula,
  problemasDeLaCedula,
  type EventoCapturado,
  type Propuesta,
  type TipoCapturado,
  type TipoDeGol,
} from "./services/cedula";
import {
  HORAS_PARA_VALIDAR_SIN_FIRMAS,
  laLigaPuedeContestar,
  ladoDe,
  transicion,
  type Estado,
  type EstadoDeLaCedula,
  type EstadoDelPartido,
} from "./services/estado-partido";

// La cédula del árbitro, sus firmas y sus correcciones (PRD §7.7 · pantallas 19, 56a y 56b).
// Lo que cambia la cédula se decide DENTRO de la transacción, con la fila de la cédula bloqueada: dos
// toques, dos delegados o dos celulares al mismo tiempo no la dejan a medias.

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string };
type Cliente = Prisma.TransactionClient | typeof db;

async function quien() {
  const usuario = await getCurrentUser();
  if (!usuario) throw new DomainError("Entra para hacer esto.", "SIN_SESION");
  await asegurarListeners();
  return usuario;
}

function fallo(error: unknown): { ok: false; error: string } {
  if (error instanceof DomainError) return { ok: false, error: error.message };
  if (error instanceof Error && "issues" in error)
    return { ok: false, error: (error as { issues: { message: string }[] }).issues[0]?.message ?? "Revisa los datos." };
  logger.error("acción de la cédula falló", { error: String(error) });
  return { ok: false, error: "Se fue la señal en la cancha. Intenta otra vez." };
}

const partidoConCedula = (id: string, cliente: Cliente = db) =>
  cliente.match.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      tournamentId: true,
      homeTeamId: true,
      awayTeamId: true,
      report: {
        select: { id: true, status: true, snapshot: true, homeScore: true, awayScore: true, submittedAt: true, homeSignedAt: true, awaySignedAt: true },
      },
    },
  });
type PartidoConCedula = NonNullable<Awaited<ReturnType<typeof partidoConCedula>>>;

/** Bloquea la cédula del partido hasta que termine la transacción y la vuelve a leer ya bloqueada */
async function bloquear(tx: Prisma.TransactionClient, matchId: string) {
  await tx.$queryRaw`SELECT "id" FROM "match_reports" WHERE "matchId" = ${matchId}::uuid FOR UPDATE`;
  const m = await partidoConCedula(matchId, tx);
  if (!m?.report) throw new NotFoundError("Esta cédula todavía no llega.");
  return { ...m, report: m.report };
}

function estadoDe(m: PartidoConCedula): Estado {
  return {
    partido: m.status as EstadoDelPartido,
    cedula: (m.report?.status ?? null) as EstadoDeLaCedula | null,
    firmas: { local: m.report?.homeSignedAt != null, visita: m.report?.awaySignedAt != null },
  };
}

function exigir(t: ReturnType<typeof transicion>) {
  if (!t.ok) throw new DomainError(t.motivo);
  return t.estado;
}

async function suspendidosDe(tournamentId: string | null, userIds: string[]) {
  if (!tournamentId || !userIds.length) return [];
  const s = await sancionesActivas(tournamentId, { userIds });
  return s.filter((x) => x.type === "SUSPENSION_PARTIDOS" || x.type === "EXPULSION_TORNEO").flatMap((x) => (x.userId ? [x.userId] : []));
}

async function nombresDe(ids: string[]) {
  const ps = await personasPorId([...new Set(ids)]);
  return Object.fromEntries(ps.map((p) => [p.id, nombreVisible(p)]));
}

/**
 * Enviar la cédula (pantalla 56b): eventos oficiales, quién jugó, observaciones y las firmas hechas en el
 * celular del árbitro. Con las dos firmas queda FINALIZADO; si no, POR_FIRMAR y les llega a los delegados.
 */
export async function enviarCedula(entrada: unknown): Promise<Resultado<{ estado: string; repetida?: boolean }>> {
  try {
    const c = enviarCedulaSchema.parse(entrada);
    const usuario = await quien();
    await assertCan(usuario.id, "report.capture", { matchId: c.matchId });
    const m = await partidoConCedula(c.matchId);
    if (!m) throw new NotFoundError("No encontramos ese partido.");
    // Sin señal se puede mandar dos veces: la segunda no cambia nada
    if ((m.report?.snapshot as { clientId?: string } | null)?.clientId === c.clientId) return { ok: true, estado: m.status, repetida: true };

    if (c.firmas.some((f) => !ladoDe(f.teamId, m)) || c.jugaron.some((j) => !ladoDe(j.teamId, m)))
      throw new DomainError("Hay un equipo que no juega este partido.");
    const firmaLocal = c.firmas.find((f) => f.teamId === m.homeTeamId);
    const firmaVisita = c.firmas.find((f) => f.teamId === m.awayTeamId);
    const t = exigir(transicion(estadoDe(m), { tipo: "ENVIAR_CEDULA", firmas: { local: !!firmaLocal, visita: !!firmaVisita } }));

    const jugaron = Object.fromEntries(c.jugaron.map((j) => [j.teamId, j.userIds]));
    const todos = c.jugaron.flatMap((j) => j.userIds);
    const [{ porEquipo, numeros }, suspendidos, nombres] = await Promise.all([
      inscritosDelPartido(m.tournamentId, [m.homeTeamId, m.awayTeamId]),
      suspendidosDe(m.tournamentId, todos),
      nombresDe(todos),
    ]);
    const problemas = problemasDeLaCedula(
      { jugaron, eventos: c.eventos, observaciones: c.observaciones },
      { localId: m.homeTeamId, visitaId: m.awayTeamId, inscritos: porEquipo, suspendidos, nombres },
    );
    if (problemas.length) throw new DomainError(problemas[0]);
    // Quien firma en el celular del árbitro tiene que ser delegado de ese equipo (PERMISOS §4)
    for (const f of c.firmas)
      if (!(await can(f.firmanteId, "report.sign", { teamId: f.teamId, matchId: m.id })))
        throw new DomainError("Esa firma no es de un delegado de ese equipo.");

    const marcador = marcadorDeLaCedula(c.eventos, m.homeTeamId, m.awayTeamId);
    const ahora = new Date();
    const firmada = t.cedula === "FIRMADA";
    const firmasEnCelular = c.firmas.map((f) => ({ teamId: f.teamId, firmanteId: f.firmanteId, en: "CELULAR_DEL_ARBITRO" }));
    const datos = {
      source: "APP_ARBITRO" as const,
      refereeId: usuario.id,
      status: t.cedula!,
      observaciones: c.observaciones || null,
      homeScore: marcador.local,
      awayScore: marcador.visita,
      submittedAt: ahora,
      homeSignedById: firmaLocal?.firmanteId ?? null,
      homeSignedAt: firmaLocal ? ahora : null,
      awaySignedById: firmaVisita?.firmanteId ?? null,
      awaySignedAt: firmaVisita ? ahora : null,
      // Copia inmutable de lo que mandó el árbitro, con los trazos de las firmas en su celular
      snapshot: {
        clientId: c.clientId,
        enviadaEn: ahora.toISOString(),
        jugaron,
        eventos: c.eventos,
        observaciones: c.observaciones,
        firmas: c.firmas.map((f) => ({ ...f, en: "CELULAR_DEL_ARBITRO" })),
      } as Prisma.InputJsonValue,
    };

    const reporte = await db.$transaction(async (tx) => {
      // El partido se toma aquí: si otro envío (otro celular) ganó, no se pisa su cédula
      const tomado = await tx.match.updateMany({
        where: { id: m.id, status: { in: ["PROGRAMADO", "EN_JUEGO"] } },
        data: { status: t.partido, endedAt: ahora, ...(firmada ? { homeScore: marcador.local, awayScore: marcador.visita } : {}) },
      });
      if (tomado.count === 0) throw new DomainError("La cédula de este partido ya se mandó.");
      await tx.matchEvent.deleteMany({ where: { matchId: m.id, source: "ARBITRO", oficial: true } });
      if (c.eventos.length)
        await tx.matchEvent.createMany({
          data: c.eventos.map((e) => ({
            matchId: m.id,
            type: e.tipo,
            minute: e.minuto,
            teamId: e.equipoId,
            playerId: e.jugadorId,
            tipoGol: e.tipoGol,
            nota: e.nota,
            source: "ARBITRO" as const,
            oficial: true,
            clientId: e.id,
            createdById: usuario.id,
          })),
        });
      // Quién jugó: la alineación del delegado (si la mandó) más los que marcó el árbitro
      for (const teamId of [m.homeTeamId, m.awayTeamId]) {
        const suyos = jugaron[teamId] ?? [];
        const lineup = await tx.lineup.upsert({
          where: { matchId_teamId: { matchId: m.id, teamId } },
          create: { matchId: m.id, teamId, submittedById: usuario.id },
          update: {},
          select: { id: true, players: { select: { userId: true } } },
        });
        const tenia = new Set(lineup.players.map((p) => p.userId));
        await tx.lineupPlayer.updateMany({ where: { lineupId: lineup.id, userId: { in: suyos } }, data: { jugo: true } });
        await tx.lineupPlayer.updateMany({ where: { lineupId: lineup.id, userId: { notIn: suyos } }, data: { jugo: false } });
        const nuevos = suyos.filter((u) => !tenia.has(u));
        if (nuevos.length)
          await tx.lineupPlayer.createMany({
            data: nuevos.map((userId) => ({ lineupId: lineup.id, userId, titular: tenia.size === 0, numero: numeros.get(userId) ?? null, jugo: true })),
          });
      }
      const r = await tx.matchReport.upsert({ where: { matchId: m.id }, create: { matchId: m.id, ...datos }, update: datos, select: { id: true } });
      // Bitácora en la misma transacción (eventos oficiales, resultado y quién firmó en este celular)
      await tx.auditLog.create({
        data: {
          actorId: usuario.id,
          action: "CREATE",
          entityType: "MatchReport",
          entityId: r.id,
          after: { marcador, eventos: c.eventos.length, firmasEnCelular, estado: t.cedula } as Prisma.InputJsonValue,
          motivo: "Cédula enviada por el árbitro",
        },
      });
      return r;
    });
    await emit("match.report_submitted", { matchId: m.id, reportId: reporte.id });
    refresh();
    return { ok: true, estado: t.partido };
  } catch (e) {
    return fallo(e);
  }
}

/** "De acuerdo · Firmar" desde el celular del delegado (pantalla 19: "Firmar sin cambios") */
export async function firmarCedula(entrada: unknown): Promise<Resultado<{ estado: string }>> {
  try {
    const { matchId, teamId } = firmarSchema.parse(entrada);
    const usuario = await quien();
    await assertCan(usuario.id, "report.sign", { teamId, matchId });
    const ahora = new Date();
    const { estado, reportId, lado } = await db.$transaction(async (tx) => {
      const m = await bloquear(tx, matchId);
      const lado = ladoDe(teamId, m);
      if (!lado) throw new DomainError("Tu equipo no juega este partido.");
      const t = exigir(transicion(estadoDe(m), { tipo: "FIRMAR", lado }));
      await tx.matchReport.update({
        where: { id: m.report.id },
        data: {
          status: t.cedula!,
          ...(lado === "local" ? { homeSignedById: usuario.id, homeSignedAt: ahora } : { awaySignedById: usuario.id, awaySignedAt: ahora }),
        },
      });
      if (t.partido === "FINALIZADO") {
        const marcador = { local: m.report.homeScore, visita: m.report.awayScore };
        await tx.match.update({ where: { id: m.id }, data: { status: "FINALIZADO", homeScore: marcador.local, awayScore: marcador.visita } });
        // Bitácora en la misma transacción: el partido ya tiene su resultado firmado
        await tx.auditLog.create({
          data: {
            actorId: usuario.id,
            action: "UPDATE",
            entityType: "Match",
            entityId: m.id,
            before: { status: m.status } as Prisma.InputJsonValue,
            after: { status: "FINALIZADO", marcador } as Prisma.InputJsonValue,
            motivo: "Cédula firmada por los dos delegados",
          },
        });
      }
      return { estado: t.partido, reportId: m.report.id, lado };
    });
    await emit("match.report_signed", { matchId, reportId, side: lado === "local" ? "home" : "away" });
    refresh();
    return { ok: true, estado };
  } catch (e) {
    return fallo(e);
  }
}

/** El delegado señala un error antes de firmar (pantalla 19): la cédula queda en pausa */
export async function pedirCorreccion(entrada: unknown): Promise<Resultado> {
  try {
    const c = pedirCorreccionSchema.parse(entrada);
    const usuario = await quien();
    await assertCan(usuario.id, "report.requestCorrection", { teamId: c.teamId, matchId: c.matchId });
    const m0 = await partidoConCedula(c.matchId);
    if (!m0?.report) throw new NotFoundError("Esta cédula todavía no llega.");
    const p = c.propuesta;
    if (!ladoDe(c.teamId, m0) || (p.equipoId && !ladoDe(p.equipoId, m0))) throw new DomainError("Ese equipo no juega este partido.");
    if (p.jugadorId) {
      const { porEquipo } = await inscritosDelPartido(m0.tournamentId, [m0.homeTeamId, m0.awayTeamId]);
      if (!p.equipoId || !porEquipo[p.equipoId]?.includes(p.jugadorId)) throw new DomainError("Ese jugador no está registrado con ese equipo.");
    }
    const correccion = await db.$transaction(async (tx) => {
      const m = await bloquear(tx, c.matchId);
      exigir(transicion(estadoDe(m), { tipo: "PEDIR_CORRECCION", lado: ladoDe(c.teamId, m)! }));
      if (c.eventoId) {
        const ev = await tx.matchEvent.count({ where: { id: c.eventoId, matchId: m.id, oficial: true, voided: false } });
        if (!ev) throw new DomainError("Ese evento ya no está en la cédula.");
        const repetida = await tx.matchReportCorrection.count({
          where: { reportId: m.report.id, eventId: c.eventoId, requestedById: usuario.id, status: "PENDIENTE" },
        });
        if (repetida) throw new DomainError("Ya señalaste ese evento: espera a que conteste el árbitro.");
      }
      const nueva = await tx.matchReportCorrection.create({
        data: {
          reportId: m.report.id,
          eventId: c.eventoId,
          kind: c.kind,
          propuesta: { ...p, equipoQueSenala: c.teamId } as Prisma.InputJsonValue,
          comentario: c.comentario || null,
          requestedById: usuario.id,
        },
        select: { id: true },
      });
      await tx.matchReport.update({ where: { id: m.report.id }, data: { status: "EN_CORRECCION" } });
      return nueva;
    });
    await emit("match.correction_requested", { matchId: c.matchId, correctionId: correccion.id });
    refresh();
    return { ok: true };
  } catch (e) {
    return fallo(e);
  }
}

/**
 * El árbitro acepta o rechaza cada corrección (pantalla 19). Si acepta, la cédula cambia (con bitácora) y
 * las firmas que ya había se borran: se vuelve a firmar (POR APROBAR).
 */
export async function responderCorreccion(entrada: unknown): Promise<Resultado<{ aceptada: boolean }>> {
  try {
    const { correctionId, aceptar } = responderCorreccionSchema.parse(entrada);
    const usuario = await quien();
    const corr = await db.matchReportCorrection.findUnique({
      where: { id: correctionId },
      select: {
        id: true,
        kind: true,
        eventId: true,
        propuesta: true,
        comentario: true,
        reportId: true,
        createdAt: true,
        report: { select: { matchId: true, match: { select: { tournament: { select: { leagueId: true } } } } } },
      },
    });
    if (!corr) throw new NotFoundError("No encontramos esa corrección.");
    const matchId = corr.report.matchId;
    // Contesta el árbitro de esa cédula; si no lo hace en 48 h, la liga (POR APROBAR)
    const leagueId = corr.report.match.tournament?.leagueId;
    const esArbitro = await can(usuario.id, "report.respondCorrection", { matchId });
    const comoLiga =
      !esArbitro &&
      !!leagueId &&
      laLigaPuedeContestar(corr.createdAt, new Date()) &&
      (await can(usuario.id, "match.validate", { leagueId, matchId }));
    if (!esArbitro && !comoLiga) throw new ForbiddenError();
    const m0 = await partidoConCedula(matchId);
    if (!m0) throw new NotFoundError("No encontramos esa cédula.");
    // Lo que no cambia mientras se contesta: inscritos, suspendidos y nombres de las dos plantillas
    const { porEquipo, numeros } = await inscritosDelPartido(m0.tournamentId, [m0.homeTeamId, m0.awayTeamId]);
    const plantillas = Object.values(porEquipo).flat();
    const [suspendidos, nombres] = await Promise.all([suspendidosDe(m0.tournamentId, plantillas), nombresDe(plantillas)]);
    const ahora = new Date();

    await db.$transaction(async (tx) => {
      const m = await bloquear(tx, matchId);
      // Se reclama la corrección: un doble toque o dos respuestas a la vez no la contestan dos veces
      const reclamada = await tx.matchReportCorrection.updateMany({
        where: { id: corr.id, status: "PENDIENTE" },
        data: { status: aceptar ? "ACEPTADA" : "RECHAZADA", respondedById: usuario.id, respondedAt: ahora },
      });
      if (reclamada.count === 0) throw new DomainError("Esa corrección ya la contestaste.");
      const quedan = await tx.matchReportCorrection.count({ where: { reportId: corr.reportId, status: "PENDIENTE" } });
      const t = exigir(transicion(estadoDe(m), { tipo: "RESPONDER_CORRECCION", aceptada: aceptar, quedanPendientes: quedan }));
      if (!aceptar) {
        await tx.matchReport.update({ where: { id: m.report.id }, data: { status: t.cedula! } });
        return;
      }

      const [eventos, lineups] = await Promise.all([
        tx.matchEvent.findMany({
          where: { matchId, oficial: true, voided: false, type: { in: ["GOL", "AUTOGOL", "AMARILLA", "ROJA"] } },
          select: { id: true, type: true, teamId: true, playerId: true, minute: true, tipoGol: true, nota: true },
        }),
        tx.lineup.findMany({ where: { matchId }, select: { id: true, teamId: true, players: { where: { jugo: true }, select: { userId: true } } } }),
      ]);
      const actuales: EventoCapturado[] = eventos.map((e) => ({
        id: e.id,
        tipo: e.type as TipoCapturado,
        equipoId: e.teamId ?? "",
        jugadorId: e.playerId ?? "",
        minuto: e.minute,
        tipoGol: (e.tipoGol as TipoDeGol | null) ?? null,
        nota: e.nota,
      }));
      const propuesta = corr.propuesta as Propuesta;
      const NUEVO = "nuevo";
      const nuevos = aplicarCorreccion(actuales, { kind: corr.kind, eventoId: corr.eventId, propuesta }, NUEVO);
      // Si el árbitro acepta que fue otro jugador, ese jugador jugó
      const jugaron = Object.fromEntries([m.homeTeamId, m.awayTeamId].map((id) => [id, lineups.find((l) => l.teamId === id)?.players.map((x) => x.userId) ?? []]));
      const agregar = propuesta.jugadorId && propuesta.equipoId && !jugaron[propuesta.equipoId]?.includes(propuesta.jugadorId) ? propuesta : null;
      if (agregar) jugaron[agregar.equipoId!] = [...(jugaron[agregar.equipoId!] ?? []), agregar.jugadorId!];
      const problemas = problemasDeLaCedula(
        { jugaron, eventos: nuevos, observaciones: "" },
        { localId: m.homeTeamId, visitaId: m.awayTeamId, inscritos: porEquipo, suspendidos, nombres },
      );
      if (problemas.length) throw new DomainError(`No se puede aceptar: ${problemas[0]}`);
      const marcador = marcadorDeLaCedula(nuevos, m.homeTeamId, m.awayTeamId);
      const antes = actuales.find((e) => e.id === corr.eventId) ?? null;
      const despues = nuevos.find((e) => e.id === (corr.kind === "FALTA_EVENTO" ? NUEVO : corr.eventId)) ?? null;

      let eventoId = corr.eventId;
      if (corr.kind === "FALTA_EVENTO" && despues) {
        const creado = await tx.matchEvent.create({
          data: {
            matchId,
            type: despues.tipo,
            minute: despues.minuto,
            teamId: despues.equipoId,
            playerId: despues.jugadorId,
            tipoGol: despues.tipoGol,
            source: "ARBITRO",
            oficial: true,
            createdById: usuario.id,
          },
          select: { id: true },
        });
        eventoId = creado.id;
      } else if (corr.kind === "SOBRA_EVENTO") {
        await tx.matchEvent.update({ where: { id: corr.eventId! }, data: { voided: true } });
      } else if (despues) {
        await tx.matchEvent.update({
          where: { id: corr.eventId! },
          data: { type: despues.tipo, minute: despues.minuto, teamId: despues.equipoId, playerId: despues.jugadorId, tipoGol: despues.tipoGol },
        });
      }
      if (agregar) {
        const lineup = lineups.find((l) => l.teamId === agregar.equipoId);
        if (lineup)
          await tx.lineupPlayer.upsert({
            where: { lineupId_userId: { lineupId: lineup.id, userId: agregar.jugadorId! } },
            create: { lineupId: lineup.id, userId: agregar.jugadorId!, titular: false, numero: numeros.get(agregar.jugadorId!) ?? null, jugo: true },
            update: { jugo: true },
          });
      }
      await tx.matchReport.update({
        where: { id: m.report.id },
        data: {
          status: t.cedula!,
          homeScore: marcador.local,
          awayScore: marcador.visita,
          homeSignedById: null,
          homeSignedAt: null,
          awaySignedById: null,
          awaySignedAt: null,
        },
      });
      // Bitácora en la misma transacción: cambió un evento oficial y quizá el resultado
      await tx.auditLog.create({
        data: {
          actorId: usuario.id,
          action: "UPDATE",
          entityType: "MatchEvent",
          entityId: eventoId ?? m.report.id,
          before: { evento: antes, marcador: { local: m.report.homeScore, visita: m.report.awayScore }, firmas: estadoDe(m).firmas } as Prisma.InputJsonValue,
          after: { evento: corr.kind === "SOBRA_EVENTO" ? null : despues, marcador, firmas: t.firmas } as Prisma.InputJsonValue,
          motivo: `Corrección ${corr.kind} aceptada por ${esArbitro ? "el árbitro" : "la liga"}${corr.comentario ? `: ${corr.comentario}` : ""}`,
        },
      });
    });
    await emit("match.correction_answered", { matchId, correctionId: corr.id, accepted: aceptar });
    refresh();
    return { ok: true, aceptada: aceptar };
  } catch (e) {
    return fallo(e);
  }
}

// ---- Validación de la liga (pantalla 46 · PRD §7.7): solo lo VALIDADO cuenta (regla 2)

type TorneoParaValidar = { id: string; leagueId: string; partidosPorRoja: number; amarillasParaSuspension: number };

/**
 * Valida un partido: resultado oficial, cédula VALIDADA, sanciones automáticas y partidos cumplidos (con
 * bitácora, en la misma transacción); luego estadísticas y `match.validated`, que recalcula la tabla y
 * encola cartas, insignias y feed. La cola se procesa al terminar la respuesta (`after`).
 */
async function validar(matchId: string, torneo: TorneoParaValidar, actorId: string) {
  const ahora = new Date();
  const r = await db.$transaction(
    async (tx) => {
      const m = await bloquear(tx, matchId);
      const horas = m.report.submittedAt ? (ahora.getTime() - m.report.submittedAt.getTime()) / 3_600_000 : 0;
      exigir(transicion(estadoDe(m), { tipo: "VALIDAR", horasDesdeEnvio: horas }));
      if (m.report.homeScore == null || m.report.awayScore == null) throw new DomainError("La cédula no trae marcador: pídele al árbitro que la revise.");
      const marcador = { local: m.report.homeScore, visita: m.report.awayScore };
      const ganador = marcador.local > marcador.visita ? m.homeTeamId : marcador.visita > marcador.local ? m.awayTeamId : null;
      await tx.match.update({
        where: { id: matchId },
        data: { status: "VALIDADO", validatedAt: ahora, validatedById: actorId, homeScore: marcador.local, awayScore: marcador.visita, winnerTeamId: ganador },
      });
      await tx.matchReport.update({ where: { id: m.report.id }, data: { status: "VALIDADA" } });
      const firmas = estadoDe(m).firmas;
      await tx.auditLog.create({
        data: {
          actorId,
          action: "VALIDATE",
          entityType: "Match",
          entityId: matchId,
          before: { status: m.status } as Prisma.InputJsonValue,
          after: { status: "VALIDADO", marcador, firmas } as Prisma.InputJsonValue,
          motivo: firmas.local && firmas.visita ? "Cédula firmada por los dos" : `Validada sin todas las firmas (${HORAS_PARA_VALIDAR_SIN_FIRMAS} h)`,
        },
      });
      const sanciones = await recalcularSanciones(tx, torneo, actorId);
      const p = await tx.match.findUniqueOrThrow({ where: { id: matchId }, select: { roundId: true } });
      return { marcador, sanciones: sanciones.creadas.length, roundId: p.roundId };
    },
    { timeout: 30_000, maxWait: 10_000 },
  );
  // Ya es oficial: aunque fallen las estadísticas, la tabla, las cartas y el feed se enteran
  try {
    await recalcularEstadisticas(torneo.id);
  } catch (error) {
    logger.error("no se recalcularon las estadísticas al validar", { matchId, error: String(error) });
  }
  await emit("match.validated", { matchId, tournamentId: torneo.id, roundId: r.roundId });
  return r;
}

async function torneoDelPartido(matchId: string) {
  const m = await db.match.findUnique({
    where: { id: matchId },
    select: { tournament: { select: { id: true, leagueId: true, partidosPorRoja: true, amarillasParaSuspension: true } } },
  });
  if (!m?.tournament) throw new NotFoundError("No encontramos ese partido.");
  return m.tournament;
}

/** "VALIDAR RESULTADO" (pantalla 46): cuenta para tabla, goleo y cartas, y se avisa a los dos equipos */
export async function validarCedula(entrada: unknown): Promise<Resultado<{ sanciones: number }>> {
  try {
    const { matchId } = validarSchema.parse(entrada);
    const usuario = await quien();
    const torneo = await torneoDelPartido(matchId);
    await assertCan(usuario.id, "match.validate", { leagueId: torneo.leagueId, matchId });
    const r = await validar(matchId, torneo, usuario.id);
    after(() => procesarCola(6));
    refresh();
    return { ok: true, sanciones: r.sanciones };
  } catch (e) {
    return fallo(e);
  }
}

/** "VALIDAR LAS LISTAS" (pantalla 46): todas las cédulas ya firmadas por los dos */
export async function validarListas(entrada: unknown): Promise<Resultado<{ validadas: number }>> {
  try {
    const { tournamentId } = validarListasSchema.parse(entrada);
    const usuario = await quien();
    const torneo = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, leagueId: true, partidosPorRoja: true, amarillasParaSuspension: true },
    });
    if (!torneo) throw new NotFoundError("No encontramos ese torneo.");
    await assertCan(usuario.id, "match.validate", { leagueId: torneo.leagueId });
    const listas = await db.match.findMany({
      where: { tournamentId, status: "FINALIZADO", report: { status: "FIRMADA" } },
      orderBy: { scheduledAt: "asc" },
      select: { id: true },
    });
    if (!listas.length) throw new DomainError("No hay cédulas firmadas por validar.");
    for (const m of listas) await validar(m.id, torneo, usuario.id);
    after(() => procesarCola(8));
    refresh();
    return { ok: true, validadas: listas.length };
  } catch (e) {
    return fallo(e);
  }
}
