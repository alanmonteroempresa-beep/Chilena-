import "server-only";
import {
  alertaPreventiva,
  amarillasAcumuladas,
  chipsDelJugador,
  cuandoTeToca,
  cuentaRegresiva,
  horarioCorto,
  lineaDeGol,
  posicionesDelGoleo,
} from "@/modules/partidos";
import {
  estadisticasDelJugador,
  goleoDelTorneo,
  proximoPartidoDelEquipo,
  sancionesActivas,
  tarjetasParaAcumulado,
  ultimoResultadoDelEquipo,
} from "@/modules/partidos/server-api";
import { respuestaDe, resumenPaseDeLista, type Respuesta } from "@/modules/equipos";
import {
  cuotaVigente,
  equipoDeCadaQuien,
  equipoPorSlug,
  equiposMasSeguidos,
  respuestasDelPaseDeLista,
} from "@/modules/equipos/server-api";
import { tablaDelTorneo, torneoVigenteDelEquipo } from "@/modules/ligas/server-api";
import { textoVencimiento } from "@/shared/lib/dates";
import { nombreCorto, nombreVisible } from "@/shared/lib/personas";
import { loQueSigue } from "./queries";

type Partido = NonNullable<Awaited<ReturnType<typeof proximoPartidoDelEquipo>>>;

/** "Te toca el domingo" con su cuenta regresiva y el pase de lista (pantallas 03 y 05) */
async function proximoDe(equipoId: string, partido: Partido | null, ahora: Date, userId?: string) {
  if (!partido?.scheduledAt) return null;
  const respuestas = await respuestasDelPaseDeLista(partido.id, equipoId);
  const mia = userId ? respuestas.find((r) => r.userId === userId) : undefined;
  const resumen = resumenPaseDeLista(respuestas.map((r) => respuestaDe(r.status)));
  const esLocal = partido.homeTeam.id === equipoId;
  return {
    jornada: partido.round?.numero ?? null,
    horario: horarioCorto(partido.scheduledAt, partido.field?.nombre),
    cuando: cuandoTeToca(ahora, partido.scheduledAt),
    cuenta: cuentaRegresiva(ahora, partido.scheduledAt),
    local: partido.homeTeam,
    visita: partido.awayTeam,
    rival: esLocal ? partido.awayTeam : partido.homeTeam,
    miRespuesta: (mia ? respuestaDe(mia.status) : null) as Respuesta | null,
    van: resumen.van,
    convocados: resumen.total,
  };
}

/** Inicio del jugador (pantalla 03): próximo partido, sus números, rachas, cuota, amarillas y goleo */
export async function datosInicioJugador(userId: string, slugEquipo: string, ahora: Date) {
  const equipo = await equipoPorSlug(slugEquipo);
  if (!equipo) return null;
  const [inscripcion, partido, cuota, [miembro]] = await Promise.all([
    torneoVigenteDelEquipo(equipo.id),
    proximoPartidoDelEquipo(equipo.id, ahora),
    cuotaVigente(equipo.id),
    equipoDeCadaQuien([userId]),
  ]);
  const torneo = inscripcion?.tournament ?? null;
  const [proximo, stats, goleo, partidos, sanciones] = await Promise.all([
    proximoDe(equipo.id, partido, ahora, userId),
    torneo ? estadisticasDelJugador(torneo.id, userId) : null,
    torneo ? goleoDelTorneo(torneo.id, 200) : [],
    torneo ? tarjetasParaAcumulado(torneo.id, userId) : [],
    torneo ? sancionesActivas(torneo.id, { userIds: [userId] }) : [],
  ]);
  const posiciones = posicionesDelGoleo(goleo);
  const acumuladas = torneo ? (amarillasAcumuladas(partidos, torneo).get(userId) ?? 0) : 0;
  const suspension = sanciones.find((s) => s.type === "SUSPENSION_PARTIDOS");
  const miPago = cuota?.payments.find((p) => p.userId === userId);

  return {
    equipo,
    torneo: torneo ? { nombre: torneo.nombre, liga: torneo.league } : null,
    dorsal: miembro?.numero ?? null,
    posicion: miembro?.posicion ?? null,
    proximo,
    stats,
    chips: stats ? chipsDelJugador(stats, posiciones.get(userId)) : [],
    cuota:
      cuota && miPago && (miPago.status === "PENDIENTE" || miPago.status === "REPORTADO")
        ? {
            concepto: cuota.concepto,
            amountCents: cuota.amountCents,
            vence: textoVencimiento(cuota.dueDate, ahora),
            enRevision: miPago.status === "REPORTADO",
          }
        : null,
    // Suspendido no recibe el "aguas": ya se sienta (§7.6 y §7.8)
    alerta: suspension || !torneo ? null : alertaPreventiva(acumuladas, torneo.amarillasParaSuspension),
    suspension: suspension
      ? { faltan: Math.max(0, (suspension.partidos ?? 0) - suspension.partidosCumplidos), motivo: suspension.motivo }
      : null,
    goleo: goleo.slice(0, 3).map((g) => ({
      userId: g.userId,
      username: g.user.username,
      nombre: nombreVisible(g.user),
      goles: g.goles,
      posicion: posiciones.get(g.userId) ?? 0,
    })),
    yo: userId,
  };
}

/** Inicio del aficionado (pantalla 05): lo que sigue, cómo quedó su equipo, el próximo, la tabla y cracks */
export async function datosInicioAficionado(userId: string, ahora: Date) {
  const sigue = await loQueSigue(userId);
  const equipo = sigue.equipos[0];
  if (!equipo) return { sigue, equipo: null, sugeridos: await equiposMasSeguidos(6) } as const;

  const [inscripcion, ultimo, partido] = await Promise.all([
    torneoVigenteDelEquipo(equipo.id),
    ultimoResultadoDelEquipo(equipo.id),
    proximoPartidoDelEquipo(equipo.id, ahora),
  ]);
  const torneo = inscripcion?.tournament ?? null;
  const [proximo, tabla, goleo] = await Promise.all([
    proximoDe(equipo.id, partido, ahora),
    torneo ? tablaDelTorneo(torneo.id) : [],
    torneo ? goleoDelTorneo(torneo.id, 12) : [],
  ]);
  const siguiendo = new Set(sigue.cracks.map((c) => c.id));
  const porSeguir = goleo.filter((g) => !siguiendo.has(g.userId)).slice(0, 3);
  const equipos = await equipoDeCadaQuien(porSeguir.map((g) => g.userId));
  const golesDeMiEquipo = ultimo?.events.filter((e) => e.teamId === equipo.id && e.type === "GOL" && e.player) ?? [];
  const ultimoGol = golesDeMiEquipo.at(-1);

  return {
    sigue,
    equipo,
    sugeridos: [],
    torneo: torneo ? { nombre: torneo.nombre, liga: torneo.league } : null,
    ultimo: ultimo
      ? {
          id: ultimo.id,
          jornada: ultimo.round?.numero ?? null,
          local: ultimo.homeTeam,
          visita: ultimo.awayTeam,
          golesLocal: ultimo.homeScore ?? 0,
          golesVisita: ultimo.awayScore ?? 0,
          gol: ultimoGol
            ? {
                minuto: ultimoGol.minute,
                texto: lineaDeGol({ minuto: null, nombre: nombreVisible(ultimoGol.player!), tipoGol: ultimoGol.tipoGol }),
              }
            : null,
        }
      : null,
    proximo,
    tabla: tabla.map((f) => ({ ...f, team: f.tournamentTeam.team })),
    cracks: porSeguir.map((g) => {
      const e = equipos.find((x) => x.userId === g.userId);
      return {
        id: g.userId,
        username: g.user.username,
        nombre: nombreVisible(g.user),
        detalle: [e ? nombreCorto(e.team.nombre) : null, `${g.goles} ${g.goles === 1 ? "gol" : "goles"}`]
          .filter(Boolean)
          .join(" · "),
      };
    }),
  } as const;
}
