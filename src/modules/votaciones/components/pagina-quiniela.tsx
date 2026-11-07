import Link from "next/link";
import { nombreCorto, nombreVisible } from "@/shared/lib/personas";
import { cn } from "@/shared/lib/utils";
import { Chip } from "@/shared/ui/chip";
import { coloresDe, Escudo } from "@/shared/ui/escudo";
import { Iniciales } from "@/shared/ui/iniciales";
import { Sobretitulo, Tarjeta } from "@/shared/ui/tarjeta";
import { datosQuiniela } from "../server/datos-quiniela";
import { cierreDeLaQuiniela, PUNTOS_GANADOR, PUNTOS_MARCADOR } from "../server/services/quiniela";
import { cuandoCierra } from "../server/services/textos";
import { Pronostico } from "./pronostico";

/**
 * Quiniela (pantalla 13 · PRD §6.8): sin dinero, puro orgullo. Pronóstico con +/–, 3 puntos si atinas al
 * marcador y 1 si atinas a quién gana; cierra 1 minuto antes. "Los que más le atinan" de tu porra o de la
 * liga y "Lo que dice la porra".
 */
export async function PaginaQuiniela({
  tournamentId,
  yo,
  miEquipo,
  partidoId,
  ranking,
  ahora,
}: {
  tournamentId: string;
  yo: string;
  miEquipo: { id: string; nombre: string } | null;
  partidoId?: string;
  ranking: "porra" | "liga";
  ahora: Date;
}) {
  const d = await datosQuiniela({ tournamentId, yo, miEquipo, partidoId, ranking: miEquipo ? ranking : "liga", ahora });
  const p = d.elegido;
  const enlace = (extra: Record<string, string | undefined>) => {
    const q = new URLSearchParams(Object.entries({ partido: p?.id, ranking, ...extra }).filter((e): e is [string, string] => e[1] != null));
    return `/mi-liga/quiniela?${q}`;
  };

  return (
    <main className="flex flex-col gap-3.5 px-4 pt-2 pb-8 lg:max-w-6xl">
      {!p ? (
        <Tarjeta className="p-4 text-sm text-muted-foreground">No hay partidos por jugar en este torneo. La quiniela vuelve con la siguiente jornada.</Tarjeta>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Tarjeta className="flex min-w-0 flex-col items-center gap-3 px-3 py-4">
            <Sobretitulo className="text-role">
              Quiniela J{d.jornada} · sin dinero · solo puntos
            </Sobretitulo>
            <h2 className="titular-momento text-center text-[44px] leading-[0.9]">¿Cuánto queda?</h2>
            <Pronostico
              key={p.id}
              matchId={p.id}
              local={{ nombre: nombreCorto(p.homeTeam.nombre), colores: coloresDe(p.homeTeam) }}
              visita={{ nombre: nombreCorto(p.awayTeam.nombre), colores: coloresDe(p.awayTeam) }}
              mio={p.mio ? { local: p.mio.homeGoals, visita: p.mio.awayGoals } : null}
              cerrada={p.cerrada}
            />
            <p className="text-center text-[12px] text-muted-foreground">
              {p.cerrada
                ? p.status === "VALIDADO" && p.mio?.points != null
                  ? `Quedó ${p.homeScore}-${p.awayScore}: te llevas ${p.mio.points} punto${p.mio.points === 1 ? "" : "s"}.`
                  : "Ya cerró. Los puntos se reparten cuando la liga valida el resultado."
                : `Cierra ${p.scheduledAt ? cuandoCierra(cierreDeLaQuiniela(p.scheduledAt), ahora) : "un minuto antes del partido"} · ${PUNTOS_MARCADOR} puntos si le atinas al marcador, ${PUNTOS_GANADOR} si le atinas a quién gana.`}
            </p>
          </Tarjeta>

          <div className="flex min-w-0 flex-col gap-3.5">
            <Tarjeta className="flex flex-col gap-2 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-[20px] font-black uppercase italic leading-none">Los que más le atinan</h3>
                {d.ranking.puedePorra && (
                  <span className="flex gap-1">
                    <Link
                      href={enlace({ ranking: "porra" })}
                      scroll={false}
                      aria-current={ranking === "porra" ? "true" : undefined}
                      className={cn("etiqueta rounded-md px-2 py-1 text-[10px]", ranking === "porra" ? "bg-role text-white" : "text-muted-foreground")}
                    >
                      Porra
                    </Link>
                    <Link
                      href={enlace({ ranking: "liga" })}
                      scroll={false}
                      aria-current={ranking === "liga" ? "true" : undefined}
                      className={cn("etiqueta rounded-md px-2 py-1 text-[10px]", ranking === "liga" ? "bg-role text-white" : "text-muted-foreground")}
                    >
                      Liga
                    </Link>
                  </span>
                )}
              </div>
              <p className="text-[12px] text-muted-foreground">{d.ranking.de}</p>
              {d.ranking.filas.length ? (
                <ol className="flex flex-col gap-1">
                  {d.ranking.filas.map((f) => {
                    const yoMero = f.userId === yo;
                    const nombre = f.persona ? nombreVisible(f.persona) : "Alguien";
                    return (
                      <li key={f.userId} className={cn("flex min-h-11 items-center gap-2.5 rounded-lg px-2", yoMero && "bg-role/12 font-semibold")}>
                        <span className="font-display w-5 text-[18px] font-black italic text-role">{f.posicion}</span>
                        <Iniciales nombre={nombre} tamano={28} />
                        <span className="min-w-0 flex-1 truncate text-[14px]">
                          {nombre}
                          {yoMero ? " · tú" : ""}
                        </span>
                        <span className="font-display text-[22px] font-black italic leading-none">
                          {f.puntos}
                          <span className="text-[11px] font-semibold not-italic text-muted-foreground">pts</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="text-[13px] text-muted-foreground">Aún no hay puntos: se reparten cuando la liga valida cada partido.</p>
              )}
            </Tarjeta>

            {d.porra.total > 0 && (
              <Tarjeta className="flex flex-col gap-2 p-3.5">
                <Sobretitulo className="text-muted-foreground">Lo que dice la porra · {d.porra.total} pronóstico{d.porra.total === 1 ? "" : "s"}</Sobretitulo>
                <div className="etiqueta flex h-7 overflow-hidden rounded-md text-[10px] font-extrabold" aria-hidden>
                  {d.porra.local > 0 && (
                    <span className="flex items-center bg-brand-blue px-2 text-white" style={{ width: `${d.porra.local}%` }}>
                      {d.porra.local >= 25 ? `${nombreCorto(p.homeTeam.nombre)} ${d.porra.local}%` : `${d.porra.local}%`}
                    </span>
                  )}
                  {d.porra.empate > 0 && (
                    <span className="flex items-center justify-center bg-surface-2 px-1" style={{ width: `${d.porra.empate}%` }}>
                      {d.porra.empate}%
                    </span>
                  )}
                  {d.porra.visita > 0 && (
                    <span className="flex items-center justify-end bg-warning px-2 text-ink" style={{ width: `${d.porra.visita}%` }}>
                      {d.porra.visita}%
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground">
                  {nombreCorto(p.homeTeam.nombre)} gana {d.porra.local}% · empate {d.porra.empate}% · {nombreCorto(p.awayTeam.nombre)} gana {d.porra.visita}%
                </p>
              </Tarjeta>
            )}

            {d.partidos.length > 1 && (
              <Tarjeta className="flex flex-col gap-1.5 p-3.5">
                <Sobretitulo className="text-muted-foreground">Más partidos de la J{d.jornada}</Sobretitulo>
                <ul className="flex flex-col">
                  {d.partidos.map((x) => (
                    <li key={x.id}>
                      <Link
                        href={enlace({ partido: x.id })}
                        scroll={false}
                        aria-current={x.id === p.id ? "true" : undefined}
                        className={cn("flex min-h-11 items-center gap-2 rounded-lg px-2 text-[14px]", x.id === p.id && "bg-role/12 font-semibold")}
                      >
                        <Escudo {...coloresDe(x.homeTeam)} tamano={14} conSiglas={false} />
                        <span className="min-w-0 flex-1 truncate">
                          {nombreCorto(x.homeTeam.nombre)} vs {nombreCorto(x.awayTeam.nombre)}
                        </span>
                        {x.mio ? (
                          <Chip tono="verde">
                            {x.mio.homeGoals}-{x.mio.awayGoals}
                          </Chip>
                        ) : x.cerrada ? (
                          <Chip>Cerrada</Chip>
                        ) : (
                          <Chip tono="lima">Pon tu marcador</Chip>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Tarjeta>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
