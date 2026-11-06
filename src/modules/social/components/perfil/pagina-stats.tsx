import type { DatosDelJugador } from "@/modules/carta/server-api";
import { Sobretitulo, Tarjeta } from "@/shared/ui/tarjeta";

/**
 * Stats del perfil (pantallas 06 y 28, pestaña STATS): las del torneo actual y las de carrera
 * (todas las ligas, docs/CARTA_E_INSIGNIAS.md §1: "las de carrera van en el perfil, no en la carta").
 */
export function PaginaStats({ d }: { d: DatosDelJugador }) {
  const carrera = d.persona.playerProfile;
  return (
    <main className="flex flex-col gap-3 px-4 pt-4 pb-6">
      {d.stats && d.torneo && (
        <Bloque
          titulo={`${d.torneo.nombre} · ${d.torneo.liga.siglas ?? d.torneo.liga.nombre}`}
          datos={[
            ["PJ", d.stats.partidos],
            ["Goles", d.stats.goles],
            ["Asist.", d.stats.asistencias],
            ["Amarillas", d.stats.amarillas],
            ["Rojas", d.stats.rojas],
            ["Domingos sin faltar", d.stats.rachaAsistencia],
          ]}
        />
      )}
      {carrera && (
        <Bloque
          titulo="Carrera en Chilena"
          datos={[
            ["PJ", carrera.partidos],
            ["Goles", carrera.goles],
            ["Asist.", carrera.asistencias],
            ["Amarillas", carrera.amarillas],
            ["Rojas", carrera.rojas],
            ["Títulos", carrera.titulos],
          ]}
        />
      )}
      {!d.stats && !carrera && <p className="text-sm text-muted-foreground">Todavía no hay partidos validados.</p>}
    </main>
  );
}

function Bloque({ titulo, datos }: { titulo: string; datos: [string, number][] }) {
  return (
    <Tarjeta className="flex flex-col gap-2 p-3.5">
      <Sobretitulo className="text-role">{titulo}</Sobretitulo>
      <dl className="grid grid-cols-3 gap-y-3 text-center">
        {datos.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex flex-col-reverse">
            <dt className="etiqueta text-[10px] leading-tight tracking-[0.12em] text-muted-foreground">{etiqueta}</dt>
            <dd className="font-display text-[30px] leading-none font-black">{valor}</dd>
          </div>
        ))}
      </dl>
    </Tarjeta>
  );
}
