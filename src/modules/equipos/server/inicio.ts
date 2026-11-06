import "server-only";
import { cuandoTeToca, horarioCorto } from "@/modules/partidos";
import { cedulaPorFirmar, proximoPartidoDelEquipo, sancionesActivas } from "@/modules/partidos/server-api";
import { estaVencido } from "@/modules/ligas";
import { cargosDelEquipo, torneoVigenteDelEquipo } from "@/modules/ligas/server-api";
import { hoyCDMX, textoVencimiento } from "@/shared/lib/dates";
import { nombreCorto, nombreVisible } from "@/shared/lib/personas";
import { cuotaVigente, equipoPorSlug, plantillaDelEquipo, respuestasDelPaseDeLista } from "./queries";
import {
  estadoEnPlantilla,
  necesitaAtencion,
  ordenarPlantilla,
  respuestaDe,
  resumenCuotas,
  resumenPaseDeLista,
  type EstadoPago,
} from "./services/plantilla";

/** Datos de la gestión del equipo para el inicio del delegado (pantalla 04). Solo lectura. */
export async function datosInicioDelegado(slugEquipo: string, ahora: Date) {
  const equipo = await equipoPorSlug(slugEquipo);
  if (!equipo) return null;
  const [inscripcion, proximo, plantilla, cuota, porFirmar] = await Promise.all([
    torneoVigenteDelEquipo(equipo.id),
    proximoPartidoDelEquipo(equipo.id, ahora),
    plantillaDelEquipo(equipo.id),
    cuotaVigente(equipo.id),
    cedulaPorFirmar(equipo.id),
  ]);
  const torneo = inscripcion?.tournament;
  const [respuestas, sanciones, cargos] = await Promise.all([
    proximo ? respuestasDelPaseDeLista(proximo.id, equipo.id) : Promise.resolve([]),
    torneo ? sancionesActivas(torneo.id, { userIds: plantilla.map((m) => m.user.id) }) : Promise.resolve([]),
    inscripcion ? cargosDelEquipo(inscripcion.id) : Promise.resolve([]),
  ]);

  const respuestaDeCadaQuien = new Map(respuestas.map((r) => [r.userId, r]));
  const pagoDeCadaQuien = new Map(cuota?.payments.map((p) => [p.userId, p.status as EstadoPago]) ?? []);
  const suspensionDeCadaQuien = new Map(
    sanciones
      .filter((s) => s.userId && s.type === "SUSPENSION_PARTIDOS")
      .map((s) => [s.userId!, Math.max(0, (s.partidos ?? 0) - s.partidosCumplidos)]),
  );

  const jugadores = ordenarPlantilla(
    plantilla.map((m) => {
      const r = respuestaDeCadaQuien.get(m.user.id);
      const faltan = suspensionDeCadaQuien.get(m.user.id);
      return {
        id: m.user.id,
        numero: m.numero,
        nombre: nombreVisible(m.user),
        respuesta: respuestaDe(r?.status),
        nota: r?.nota ?? null,
        faltanDeSuspension: faltan ?? null,
        estado: estadoEnPlantilla({ suspendido: faltan != null, pagoCuota: pagoDeCadaQuien.get(m.user.id) }),
      };
    }),
  );

  // "Arbitraje J16 + multa" (pantalla 04): la multa al final
  const pendientesALaLiga = cargos
    .filter((c) => c.status === "PENDIENTE" || c.status === "REPORTADO")
    .sort((a, b) => Number(a.concept === "MULTA") - Number(b.concept === "MULTA"));
  const venceAntes = pendientesALaLiga
    .map((c) => c.dueDate)
    .filter((d): d is Date => d != null)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const rival = proximo ? (proximo.homeTeam.id === equipo.id ? proximo.awayTeam : proximo.homeTeam) : null;
  return {
    equipo,
    torneo: torneo ? { nombre: torneo.nombre, liga: torneo.league } : null,
    proximo:
      proximo && proximo.scheduledAt && rival
        ? {
            jornada: proximo.round?.numero ?? null,
            rival: nombreCorto(rival.nombre),
            cuando: cuandoTeToca(ahora, proximo.scheduledAt),
            horario: horarioCorto(proximo.scheduledAt, proximo.field?.nombre),
          }
        : null,
    paseDeLista: proximo ? resumenPaseDeLista(jugadores.map((j) => j.respuesta)) : null,
    vanAlPartido: jugadores.filter((j) => j.respuesta === "VA").map((j) => j.nombre),
    jugadores,
    enAtencion: jugadores.filter(necesitaAtencion).length,
    cuota: cuota
      ? {
          concepto: cuota.concepto,
          // Solo quien tiene la cuota a su nombre (el que llegó después no la debe)
          ...resumenCuotas(
            jugadores.map((j) => pagoDeCadaQuien.get(j.id)).filter((p): p is EstadoPago => p != null),
            cuota.amountCents,
          ),
        }
      : null,
    aLaLiga: {
      totalCents: pendientesALaLiga.reduce((s, c) => s + c.amountCents, 0),
      conceptos: pendientesALaLiga.map((c) => (c.concept === "MULTA" ? "multa" : (c.descripcion ?? c.concept.toLowerCase()))),
      vence: venceAntes ? textoVencimiento(venceAntes, ahora) : null,
    },
    pagosALaLiga: cargos.slice(0, 4).map((c) => ({
      id: c.id,
      descripcion: c.descripcion ?? c.concept,
      amountCents: c.amountCents,
      status: c.status,
      vence: c.dueDate ? textoVencimiento(c.dueDate, ahora) : null,
      vencido: estaVencido(c, hoyCDMX(ahora)),
    })),
    cedulaPorFirmar: porFirmar
      ? {
          jornada: porFirmar.match.round?.numero ?? null,
          partido: `${nombreCorto(porFirmar.match.homeTeam.nombre)} ${porFirmar.match.homeScore ?? 0}–${porFirmar.match.awayScore ?? 0} ${nombreCorto(porFirmar.match.awayTeam.nombre)}`,
        }
      : null,
  };
}
