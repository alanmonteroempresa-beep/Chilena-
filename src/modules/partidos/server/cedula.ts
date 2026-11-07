import "server-only";
import { personasPorId } from "@/modules/core/server-api";
import { nombreCorto, nombreDeArbitro, nombreDeFirma, nombreVisible } from "@/shared/lib/personas";
import { coloresDe, type ColoresEquipo } from "@/shared/ui/escudo";
import { cedulaDelPartido } from "./queries";
import { aplicarCorreccion, textoDelEvento, type EventoCapturado, type Propuesta, type TipoCapturado, type TipoDeGol, type TipoDeCorreccion } from "./services/cedula";
import { horarioCorto } from "./services/proximo";

export type EquipoDeLaVista = { teamId: string; nombre: string; corto: string; siglas: string; slug: string; colores: ColoresEquipo };
export type EventoDeLaVista = EventoCapturado & { nombre: string; numero: number | null };
export type CorreccionDeLaVista = {
  id: string;
  eventoId: string | null;
  kind: TipoDeCorreccion;
  estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA";
  quien: string;
  equipo: string;
  requestedById: string;
  creadaEn: Date;
  titulo: string;
  dice: string | null;
  debeDecir: string | null;
  comentario: string | null;
};

const TITULO: Record<TipoDeCorreccion, string> = {
  JUGADOR_EQUIVOCADO: "¿De quién fue?",
  MINUTO: "¿En qué minuto fue?",
  TIPO_EVENTO: "¿Qué fue en realidad?",
  FALTA_EVENTO: "Falta un evento",
  SOBRA_EVENTO: "Esto no pasó",
};
const DEL: Record<TipoCapturado, string> = { GOL: "Gol", AUTOGOL: "Autogol", AMARILLA: "Amarilla", ROJA: "Roja" };

/**
 * La cédula enviada como la ven el árbitro y los delegados (pantallas 19 y 56b): marcador de la cédula,
 * firmas, eventos con nombre y dorsal, quién jugó y las correcciones con su DICE → DEBE DECIR.
 */
export async function vistaDeLaCedula(matchId: string) {
  const m = await cedulaDelPartido(matchId);
  if (!m) return null;
  const equipo = (t: typeof m.homeTeam): EquipoDeLaVista => ({
    teamId: t.id,
    nombre: t.nombre,
    corto: nombreCorto(t.nombre),
    siglas: t.siglas ?? nombreCorto(t.nombre).slice(0, 3).toUpperCase(),
    slug: t.slug,
    colores: coloresDe(t),
  });
  const local = equipo(m.homeTeam);
  const visita = equipo(m.awayTeam);

  const enAlineacion = new Map(m.lineups.flatMap((l) => l.players.map((p) => [p.userId, { nombre: nombreVisible(p.user), numero: p.numero, teamId: l.teamId, jugo: p.jugo }])));
  const propuestas = (m.report?.corrections ?? []).map((c) => c.propuesta as Propuesta);
  const faltan = [...new Set([...m.events.map((e) => e.playerId), ...propuestas.map((p) => p.jugadorId)].filter((id): id is string => !!id && !enAlineacion.has(id)))];
  const otros = faltan.length ? await personasPorId(faltan) : [];
  const nombres: Record<string, string> = Object.fromEntries([
    ...[...enAlineacion].map(([id, p]) => [id, p.nombre] as const),
    ...otros.map((p) => [p.id, nombreVisible(p)] as const),
  ]);

  const eventos: EventoDeLaVista[] = m.events.map((e) => ({
    id: e.id,
    tipo: e.type as TipoCapturado,
    equipoId: e.teamId ?? "",
    jugadorId: e.playerId ?? "",
    minuto: e.minute,
    tipoGol: (e.tipoGol as TipoDeGol | null) ?? null,
    nota: e.nota,
    nombre: nombres[e.playerId ?? ""] ?? "¿quién?",
    numero: enAlineacion.get(e.playerId ?? "")?.numero ?? null,
  }));
  const jugaron = Object.fromEntries(
    [local, visita].map((t) => [
      t.teamId,
      [...enAlineacion]
        .filter(([, p]) => p.teamId === t.teamId && p.jugo)
        .map(([userId, p]) => ({ userId, nombre: p.nombre, numero: p.numero }))
        .sort((a, b) => (a.numero ?? 99) - (b.numero ?? 99)),
    ]),
  );

  const correcciones: CorreccionDeLaVista[] = (m.report?.corrections ?? []).map((c) => {
    const original = eventos.find((e) => e.id === c.eventId) ?? null;
    const propuesta = c.propuesta as Propuesta & { equipoQueSenala?: string };
    let debeDecir: string | null = null;
    if (c.status === "PENDIENTE") {
      try {
        const nuevos = aplicarCorreccion(eventos, { kind: c.kind, eventoId: c.eventId, propuesta }, "nuevo");
        const cambiado = nuevos.find((e) => e.id === (c.kind === "FALTA_EVENTO" ? "nuevo" : c.eventId));
        debeDecir = c.kind === "SOBRA_EVENTO" ? "No pasó" : cambiado ? textoDelEvento(cambiado, nombres) : null;
      } catch {
        debeDecir = null;
      }
    }
    const lado = propuesta.equipoQueSenala === visita.teamId ? visita : local;
    return {
      id: c.id,
      eventoId: c.eventId,
      kind: c.kind,
      estado: c.status,
      quien: nombreVisible(c.requestedBy),
      equipo: lado.corto,
      requestedById: c.requestedById,
      creadaEn: c.createdAt,
      titulo:
        c.kind === "JUGADOR_EQUIVOCADO" && original
          ? `${DEL[original.tipo]}${original.minuto != null ? ` del ${original.minuto}'` : ""} ¿de quién?`
          : TITULO[c.kind],
      // Ya contestada, el evento ya cambió: solo se muestra qué se señaló
      dice: original && c.status === "PENDIENTE" ? textoDelEvento(original, nombres) : null,
      debeDecir,
      comentario: c.comentario,
    };
  });

  const r = m.report;
  return {
    matchId: m.id,
    tournamentId: m.tournamentId,
    refereeId: m.refereeId,
    partido: m.status,
    jornada: m.round?.numero ?? null,
    horario: m.scheduledAt ? horarioCorto(m.scheduledAt, m.field?.nombre) : null,
    arbitro: m.referee ? nombreDeArbitro(m.referee) : "el árbitro",
    local,
    visita,
    cedula: r
      ? {
          estado: r.status,
          marcador: { local: r.homeScore ?? 0, visita: r.awayScore ?? 0 },
          observaciones: r.observaciones,
          enviadaEn: r.submittedAt,
          firmas: {
            local: r.homeSignedAt && r.homeSignedBy ? nombreDeFirma(r.homeSignedBy) : null,
            visita: r.awaySignedAt && r.awaySignedBy ? nombreDeFirma(r.awaySignedBy) : null,
          },
        }
      : null,
    eventos,
    jugaron,
    correcciones,
  };
}

export type VistaDeLaCedula = NonNullable<Awaited<ReturnType<typeof vistaDeLaCedula>>>;
