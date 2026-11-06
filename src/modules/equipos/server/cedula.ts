import "server-only";
import { personasPorId } from "@/modules/core/server-api";
import { NIVEL_ALERTA, textoAlerta } from "@/modules/partidos";
import { nombreDeFirma } from "@/shared/lib/personas";
import { revisionDeAlineacion } from "./alineacion";
import { alineacionDe, delegadosDe } from "./queries";

/** Un jugador como lo ve el árbitro en "¿Quién jugó?" (pantalla 56a) */
export type JugadorDeLaCedula = {
  userId: string;
  nombre: string;
  numero: number | null;
  /** Rojo de la alineación (suspendido, otro equipo, no registrado): no se puede marcar */
  bloqueado: boolean;
  motivo: string | null;
  /** Viene marcado: el delegado lo mandó en la alineación */
  enAlineacion: boolean;
};

/**
 * Lo que la cédula necesita de cada equipo (pantallas 56a y 56b): la plantilla con sus rojos, quiénes
 * venían en la alineación que mandó el delegado y los delegados que pueden firmar en el celular del árbitro.
 */
export async function plantillasParaLaCedula(matchId: string, tournamentId: string | null, teamIds: string[]) {
  const delegados = await delegadosDe(teamIds);
  const personas = await personasPorId(delegados.map((d) => d.userId));
  return Promise.all(
    teamIds.map(async (teamId) => {
      const [{ jugadores, revision }, alineacion] = await Promise.all([revisionDeAlineacion(teamId, tournamentId), alineacionDe(matchId, teamId)]);
      const enAlineacion = new Set(alineacion?.players.map((p) => p.userId) ?? []);
      const lista: JugadorDeLaCedula[] = jugadores.map((j) => {
        const r = revision.porJugador.find((x) => x.userId === j.userId);
        const roja = r?.alertas.find((a) => NIVEL_ALERTA[a.tipo] === "ROJO");
        return {
          userId: j.userId,
          nombre: j.nombre,
          numero: j.numero,
          bloqueado: r?.bloqueado ?? false,
          motivo: roja ? textoAlerta(roja).titulo : null,
          enAlineacion: enAlineacion.has(j.userId) && !(r?.bloqueado ?? false),
        };
      });
      lista.sort((a, b) => Number(b.enAlineacion) - Number(a.enAlineacion) || Number(a.bloqueado) - Number(b.bloqueado) || (a.numero ?? 99) - (b.numero ?? 99));
      return {
        teamId,
        conAlineacion: alineacion != null,
        jugadores: lista,
        delegados: delegados
          .filter((d) => d.teamId === teamId)
          .flatMap((d) => {
            const p = personas.find((x) => x.id === d.userId);
            return p ? [{ userId: p.id, nombre: nombreDeFirma(p) }] : [];
          }),
      };
    }),
  );
}

export type PlantillaDeLaCedula = Awaited<ReturnType<typeof plantillasParaLaCedula>>[number];
