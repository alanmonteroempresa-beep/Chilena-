import "server-only";
import { registerRule } from "@/modules/core";
import { insigniaPorCodigo } from "@/modules/carta/server-api";
import { cuentaReclamada, personasPorId } from "@/modules/core/server-api";
import { delegadosDe, plantillaDelEquipo } from "@/modules/equipos/server-api";
import { horarioCorto } from "@/modules/partidos";
import { alertasDeAmarillas, cedulaDelPartido, partidoDelDia, sancionesDelPartido } from "@/modules/partidos/server-api";
import { nombreCorto, nombreDeArbitro } from "@/shared/lib/personas";
import { datosDeComentario, duenosDePost } from "@/modules/social/server-api";
import { cuandoCierra } from "@/modules/votaciones";
import { on } from "@/shared/events/bus";
import { nombreVisible } from "@/shared/lib/personas";
import { notificar } from "./notificar";
import { reglaCuentaReclamada } from "./reglas";

const EMOJI: Record<string, string> = { FUEGO: "🔥", GOLAZO: "⚽", TROFEO: "🏆" };
const QUE_COSA: Record<string, string> = {
  NORMAL: "tu publicación",
  AUTO_GOL: "tu gol",
  AUTO_INSIGNIA: "tu insignia",
  AUTO_RACHA: "tu racha",
};

/** El equipo del delegado que señaló (va en la propuesta de la corrección) */
function equipoQueSenala<T extends { id: string }>(m: { homeTeam: T; awayTeam: T }, propuesta: unknown): T {
  const id = (propuesta as { equipoQueSenala?: string } | null)?.equipoQueSenala;
  return id === m.awayTeam.id ? m.awayTeam : m.homeTeam;
}

async function persona(id: string) {
  const [p] = await personasPorId([id]);
  return p ? { ...p, nombreVisible: nombreVisible(p) } : null;
}

// Eventos que escucha el módulo `notificaciones` (docs/NOTIFICACIONES.md §2)
export function registerListeners() {
  // Activar avisos en su celular (push)
  registerRule("push.subscribe", reglaCuentaReclamada(cuentaReclamada));

  on("post.reacted", async ({ postId, userId, type }) => {
    const post = await duenosDePost(postId);
    const dueno = post?.authorId ?? post?.subjectUserId;
    const actor = await persona(userId);
    if (!post || !dueno || !actor) return;
    const cosa = QUE_COSA[post.type] ?? "tu publicación";
    await notificar({
      userIds: [dueno],
      actorId: userId,
      type: "REACCION",
      title: `${actor.nombreVisible} le echó ${EMOJI[type] ?? "🔥"} a ${cosa}`,
      href: `/post/${postId}`,
      agrupar: {
        clave: `reaccion:${postId}`,
        nombre: actor.nombreVisible,
        titulo: (q, n) => (n === 1 ? `${q} le echó ${EMOJI[type] ?? "🔥"} a ${cosa}` : `${q} reaccionaron a ${cosa}`),
      },
    });
  });

  on("comment.created", async ({ commentId }) => {
    const c = await datosDeComentario(commentId);
    const actor = c ? await persona(c.authorId) : null;
    if (!c || !actor) return;
    const dueno = c.postId ? (c.post?.authorId ?? c.post?.subjectUserId) : c.wallUserId;
    if (!dueno) return;
    await notificar({
      userIds: [dueno],
      actorId: c.authorId,
      type: "COMENTARIO",
      title: `${actor.nombreVisible} ${c.postId ? "le echó porra a tu publicación" : "te echó porra en tu muro"}`,
      body: `"${c.body.slice(0, 90)}${c.body.length > 90 ? "…" : ""}"`,
      href: c.postId ? `/post/${c.postId}` : `/j/${c.wallUser?.username}#porra`,
    });
  });

  on("user.followed", async ({ followerId, followedUserId }) => {
    if (!followedUserId) return;
    const actor = await persona(followerId);
    if (!actor) return;
    await notificar({
      userIds: [followedUserId],
      actorId: followerId,
      type: "NUEVO_SEGUIDOR",
      title: `${actor.nombreVisible} empezó a seguirte`,
      href: `/j/${actor.username}`,
      agrupar: {
        clave: `seguidores:${followedUserId}`,
        nombre: actor.nombreVisible,
        titulo: (q, n) => (n === 1 ? `${q} empezó a seguirte` : `${q} empezaron a seguirte`),
      },
    });
  });

  on("badge.awarded", async ({ userId, badgeCode }) => {
    const [yo, badge] = await Promise.all([
      persona(userId),
      insigniaPorCodigo(badgeCode),
    ]);
    if (!yo || !badge) return;
    await notificar({
      userIds: [userId],
      type: "INSIGNIA",
      title: `${badge.icon ?? "🏅"} Ganaste la insignia ${badge.nombre}`,
      body: badge.descripcion,
      href: `/j/${yo.username}/insignias`,
    });
  });

  on("attendance.link_opened", async ({ matchId, teamId, byUserId }) => {
    const [p, plantilla, delegado] = await Promise.all([partidoDelDia(matchId), plantillaDelEquipo(teamId), persona(byUserId)]);
    if (!p) return;
    const rival = p.homeTeam.id === teamId ? p.awayTeam : p.homeTeam;
    await notificar({
      userIds: plantilla.map((m) => m.user.id),
      actorId: byUserId,
      type: "PASE_DE_LISTA",
      title: `${delegado?.nombreVisible ?? "Tu delegado"} abrió el pase de lista: ¿vas vs ${nombreCorto(rival.nombre)}?`,
      body: p.scheduledAt ? horarioCorto(p.scheduledAt, p.field?.nombre) : null,
      href: "/inicio",
      partidoEn: p.scheduledAt,
    });
  });

  // ---- La cédula (PRD §7.7 · pantallas 04, 19 y 56b)
  on("match.report_submitted", async ({ matchId }) => {
    const m = await cedulaDelPartido(matchId);
    if (!m?.report) return;
    const r = m.report;
    const titulo = `Cédula${m.round?.numero ? ` J${m.round.numero}` : ""} · ${nombreCorto(m.homeTeam.nombre)} ${r.homeScore ?? 0}–${r.awayScore ?? 0} ${nombreCorto(m.awayTeam.nombre)}`;
    // A quien le falta firmar: revisa y firma (o señala)
    // Quien firmó en el celular del árbitro: que sepa que su firma quedó (y avise si no fue él)
    const arbitro = m.referee ? nombreDeArbitro(m.referee) : "el árbitro";
    for (const [t, quien] of [
      [m.homeTeam, r.homeSignedAt ? r.homeSignedBy : null],
      [m.awayTeam, r.awaySignedAt ? r.awaySignedBy : null],
    ] as const)
      if (quien)
        await notificar({
          userIds: [quien.id],
          actorId: m.refereeId,
          type: "CEDULA_POR_FIRMAR",
          title: `${titulo}: firmaste en el celular de ${arbitro}`,
          body: "Si no fuiste tú, avísale a la liga.",
          href: `/equipo/${t.slug}/cedula/${matchId}`,
          data: { accion: "Ver cédula" },
        });
    const faltan = [r.homeSignedAt ? null : m.homeTeam, r.awaySignedAt ? null : m.awayTeam].filter((t) => t != null);
    const delegados = await delegadosDe(faltan.map((t) => t.id));
    for (const t of faltan)
      await notificar({
        userIds: delegados.filter((d) => d.teamId === t.id).map((d) => d.userId),
        actorId: m.refereeId,
        type: "CEDULA_POR_FIRMAR",
        title: `${titulo}: revísala y fírmala`,
        body: "Si algo está mal, señálalo antes de firmar.",
        href: `/equipo/${t.slug}/cedula/${matchId}`,
      });
  });

  on("match.report_signed", async ({ matchId, side }) => {
    const m = await cedulaDelPartido(matchId);
    if (!m?.report || !m.refereeId) return;
    const quien = side === "home" ? m.report.homeSignedBy : m.report.awaySignedBy;
    const ambas = m.report.homeSignedAt && m.report.awaySignedAt;
    await notificar({
      userIds: [m.refereeId],
      actorId: quien?.id,
      type: "CEDULA_POR_FIRMAR",
      title: ambas
        ? `Firmaron los dos: la cédula de ${nombreCorto(m.homeTeam.nombre)} vs ${nombreCorto(m.awayTeam.nombre)} ya está en la liga`
        : `${quien ? nombreVisible(quien) : "Un delegado"} firmó la cédula de ${nombreCorto(m.homeTeam.nombre)} vs ${nombreCorto(m.awayTeam.nombre)}`,
      href: `/arbitro/cedula/${matchId}`,
      data: { accion: "Ver cédula" },
    });
  });

  on("match.correction_requested", async ({ matchId, correctionId }) => {
    const m = await cedulaDelPartido(matchId);
    const c = m?.report?.corrections.find((x) => x.id === correctionId);
    if (!m?.refereeId || !c) return;
    const equipo = equipoQueSenala(m, c.propuesta);
    await notificar({
      userIds: [m.refereeId],
      actorId: c.requestedById,
      type: "CORRECCION_CEDULA",
      title: `${nombreVisible(c.requestedBy)} (${nombreCorto(equipo.nombre)}) señaló algo en la cédula: te piden corregir`,
      body: c.comentario,
      href: `/arbitro/cedula/${matchId}`,
    });
  });

  on("match.correction_answered", async ({ matchId, correctionId, accepted }) => {
    const m = await cedulaDelPartido(matchId);
    const c = m?.report?.corrections.find((x) => x.id === correctionId);
    if (!m || !c) return;
    const arbitro = m.referee ? nombreVisible(m.referee) : "El árbitro";
    const equipo = equipoQueSenala(m, c.propuesta);
    await notificar({
      userIds: [c.requestedById],
      actorId: m.refereeId,
      type: "CORRECCION_CEDULA",
      title: accepted ? `${arbitro} aceptó tu corrección: revisa y firma` : `${arbitro} rechazó tu corrección`,
      body: accepted ? "La cédula cambió; los dos equipos vuelven a firmar." : "Puedes firmar o señalar otra cosa.",
      href: `/equipo/${equipo.slug}/cedula/${matchId}`,
    });
    // Si la cédula cambió, el otro equipo también vuelve a firmar
    if (accepted) {
      const otro = equipo.id === m.homeTeam.id ? m.awayTeam : m.homeTeam;
      const delegados = await delegadosDe([otro.id]);
      await notificar({
        userIds: delegados.map((d) => d.userId),
        actorId: m.refereeId,
        type: "CEDULA_POR_FIRMAR",
        title: `La cédula de ${nombreCorto(m.homeTeam.nombre)} vs ${nombreCorto(m.awayTeam.nombre)} cambió: vuelve a firmar`,
        href: `/equipo/${otro.slug}/cedula/${matchId}`,
      });
    }
  });

  // ---- La liga validó (PRD §7.7 y §7.8): ya es oficial, quién se sienta y quién va a una amarilla
  on("match.validated", async ({ matchId }) => {
    const m = await cedulaDelPartido(matchId);
    if (!m || m.status !== "VALIDADO") return;
    const marcador = `${nombreCorto(m.homeTeam.nombre)} ${m.homeScore ?? 0}–${m.awayScore ?? 0} ${nombreCorto(m.awayTeam.nombre)}`;
    const [local, visita, sanciones, alertas] = await Promise.all([
      plantillaDelEquipo(m.homeTeam.id),
      plantillaDelEquipo(m.awayTeam.id),
      sancionesDelPartido(matchId),
      alertasDeAmarillas(matchId),
    ]);
    await notificar({
      userIds: [...local, ...visita].map((x) => x.user.id),
      type: "RESULTADO_OFICIAL",
      title: `Ya es oficial: ${marcador}`,
      body: `La liga validó la cédula${m.round?.numero ? ` de la J${m.round.numero}` : ""}. Ya cuenta para la tabla, el goleo y tu carta.`,
      href: `/partido/${matchId}`,
    });
    for (const s of sanciones)
      if (s.userId)
        await notificar({
          userIds: [s.userId],
          type: "SANCION",
          title: `Te toca sentarte ${s.partidos === 1 ? "un partido" : `${s.partidos} partidos`}`,
          body: s.motivo,
          href: "/inicio",
        });
    for (const a of alertas)
      await notificar({
        userIds: [a.userId],
        type: "ALERTA_TARJETAS",
        title: `Aguas: llevas ${a.acumuladas} amarillas. Una más y te sientas un partido.`,
        href: "/inicio",
      });
  });

  // ---- Se abrió la votación del MVP (pantalla 12): a los dos equipos
  on("poll.opened", async ({ type, matchId, closesAt }) => {
    if (type !== "MVP_PARTIDO" || !matchId) return;
    const m = await partidoDelDia(matchId);
    if (!m) return;
    const [local, visita] = await Promise.all([plantillaDelEquipo(m.homeTeam.id), plantillaDelEquipo(m.awayTeam.id)]);
    const marcador = `${nombreCorto(m.homeTeam.nombre)} ${m.homeScore ?? 0}–${m.awayScore ?? 0} ${nombreCorto(m.awayTeam.nombre)}`;
    await notificar({
      userIds: [...local, ...visita].map((x) => x.user.id),
      type: "VOTACION_ABIERTA",
      title: `¿Quién se la rifó? Vota el MVP de ${marcador}`,
      body: `Cierra ${cuandoCierra(new Date(closesAt), new Date())}. Un toque y listo.`,
      href: "/mi-liga/votaciones",
    });
  });

  on("card.recalculated", async ({ userId, media, delta }) => {
    if (media == null || !delta) return;
    const yo = await persona(userId);
    if (!yo) return;
    await notificar({
      userIds: [userId],
      type: "CARTA_ACTUALIZADA",
      title: delta > 0 ? `Tu carta subió a ${media} (+${delta})` : `Tu carta bajó a ${media} (${delta})`,
      body: "Sale de la cédula validada de tu último partido.",
      href: `/j/${yo.username}/carta`,
    });
  });
}
