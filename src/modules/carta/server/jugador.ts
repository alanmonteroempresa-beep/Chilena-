import "server-only";
import { perfilPublico } from "@/modules/core/server-api";
import { equipoDeCadaQuien } from "@/modules/equipos/server-api";
import { filaDeLaTabla, jugadoresDelTorneo, torneoVigenteDelEquipo } from "@/modules/ligas/server-api";
import { posicionesDelGoleo } from "@/modules/partidos";
import { estadisticasDelJugador, goleoDelTorneo, jornadaQueViene } from "@/modules/partidos/server-api";
import {
  evaluarInsignia,
  evaluarInsignias,
  laMasCercana,
  type CriterioInsignia,
  type EstadoInsignia,
  type HistorialJugador,
} from "./badges";
import type { Carta, GrupoPosicion, NivelCarta, Ventana } from "./formula";
import { calcularCartas } from "./persistir";
import { cartaGuardada, catalogoDeInsignias, insigniasGuardadas, rarezaEntre } from "./queries";

/**
 * Todo lo del jugador para su perfil, su carta y sus insignias (pantallas 06, 14, 25 y 28).
 * Lee lo GUARDADO (`player_cards`, `user_badges`, que llena la cola de `match.validated`); si todavía no
 * hay nada guardado, lo calcula con lo validado (regla 2).
 */
export async function datosDelJugador(username: string, { conRareza = false } = {}) {
  const persona = await perfilPublico(username);
  if (!persona) return null;
  const [[miembro], catalogo, guardada, guardadas] = await Promise.all([
    equipoDeCadaQuien([persona.id]),
    catalogoDeInsignias(),
    cartaGuardada(persona.id),
    insigniasGuardadas(persona.id),
  ]);
  const inscripcion = miembro ? await torneoVigenteDelEquipo(miembro.team.id) : null;
  const torneo = inscripcion?.tournament ?? null;
  const [stats, goleo, fila, jornadaSiguiente, calculada] = await Promise.all([
    torneo ? estadisticasDelJugador(torneo.id, persona.id) : null,
    torneo ? goleoDelTorneo(torneo.id, 200) : [],
    inscripcion ? filaDeLaTabla(inscripcion.id) : null,
    torneo ? jornadaQueViene(torneo.id) : null,
    guardada ? null : calcularCartas([persona.id]).then((m) => m.get(persona.id) ?? null),
  ]);

  const posicion = persona.playerProfile?.posicionPrincipal ?? miembro?.posicion ?? null;
  const guardado = guardada?.atributos as { atributos: Carta["atributos"]; ventana: Ventana } | null;
  const carta: Carta =
    guardada && guardado
      ? {
          grupo: guardada.positionGroup as GrupoPosicion,
          atributos: guardado.atributos,
          media: guardada.media,
          enConstruccion: guardada.enConstruccion,
          nivel: guardada.tier.toLowerCase() as NivelCarta,
          partidosValidados: guardada.partidosValidados,
        }
      : calculada!.carta;
  const ventana: Ventana = guardado?.ventana ?? calculada!.ventana;
  const posicionGoleo = posicionesDelGoleo(goleo).get(persona.id);
  const esJugador = guardada != null || (calculada?.historial.length ?? 0) > 0 || miembro != null;

  const insignias = catalogo
    .filter((b) => b.categoria !== "AFICIONADO")
    .map((b) => ({ ...b, criteria: b.criteria as CriterioInsignia }));
  // Contexto del torneo para las pistas de lo que depende del cierre ("Vas 1º · J15/18")
  const contexto: HistorialJugador = {
    partidos: calculada?.historial ?? [],
    esPortero: carta.grupo === "PORTERO",
    esPionero: persona.isPionero || persona.claimedAt != null,
    torneo: torneo
      ? {
          nombre: torneo.nombre,
          cerrado: false,
          posicionGoleo,
          jornada: jornadaSiguiente ? jornadaSiguiente - 1 : undefined,
          jornadas: torneo.numJornadas ?? undefined,
          amarillas: stats?.amarillas ?? 0,
          rojas: stats?.rojas ?? 0,
          jugados: stats?.partidos ?? 0,
          equipo: fila ? { pj: fila.pj, pp: fila.pp } : undefined,
        }
      : undefined,
  };
  let estados: EstadoInsignia[] = [];
  if (esJugador) {
    if (guardada) {
      const porCodigo = new Map(guardadas.map((g) => [g.badge.code, g]));
      estados = insignias.map((b) => {
        const g = porCodigo.get(b.code);
        const pista = evaluarInsignia(b, { ...contexto, partidos: [] });
        if (!g) return pista;
        return { code: b.code, veces: g.veces, progreso: g.progreso ?? undefined, meta: g.meta ?? undefined, pista: g.veces ? undefined : pista.pista };
      });
    } else {
      estados = evaluarInsignias(insignias, contexto);
    }
  }

  // Rareza: % de los jugadores del torneo que la tienen (solo en la colección, pantalla 28)
  const rareza = conRareza && torneo ? await rarezaEntre(await jugadoresDelTorneo(torneo.id)) : new Map<string, number>();

  return {
    persona,
    equipo: miembro ? { ...miembro.team, dorsal: miembro.numero } : null,
    torneo: torneo ? { nombre: torneo.nombre, liga: torneo.league } : null,
    esJugador,
    posicion,
    carta,
    ventana,
    stats,
    posicionGoleo,
    insignias: insignias.map((b) => ({ ...b, estado: estados.find((e) => e.code === b.code) ?? { code: b.code, veces: 0 }, rareza: rareza.get(b.code) })),
    masCercana: laMasCercana(estados),
  };
}

export type DatosDelJugador = NonNullable<Awaited<ReturnType<typeof datosDelJugador>>>;

const POSICION: Record<string, string> = {
  POR: "Portero",
  DFC: "Defensa central",
  LAT: "Lateral",
  MCD: "Contención",
  MC: "Medio",
  MCO: "Media punta",
  EXT: "Extremo",
  DC: "Delantero",
};

/** Lo que va en el encabezado del perfil (pantallas 06 y 28): "Delantero · #9 · Dep. Portales" */
export function encabezadoDe(d: DatosDelJugador) {
  const ganadas = d.insignias.filter((i) => i.estado.veces > 0).length;
  return {
    username: d.persona.username,
    nombre: d.persona.sobrenombre?.trim() || d.persona.nombre,
    detalle:
      [d.posicion ? POSICION[d.posicion] : null, d.equipo?.dorsal != null ? `#${d.equipo.dorsal}` : null, d.equipo?.nombre]
        .filter(Boolean)
        .join(" · ") || (d.persona.alcaldia ?? "En Chilena"),
    insignias: d.esJugador ? { ganadas, total: d.insignias.length } : undefined,
  };
}
