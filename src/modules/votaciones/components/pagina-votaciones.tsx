import Link from "next/link";
import { Star } from "lucide-react";
import { nombreCorto, nombreVisible } from "@/shared/lib/personas";
import { cn } from "@/shared/lib/utils";
import { Chip } from "@/shared/ui/chip";
import { coloresDe, Escudo } from "@/shared/ui/escudo";
import { Iniciales } from "@/shared/ui/iniciales";
import { Sobretitulo, Tarjeta } from "@/shared/ui/tarjeta";
import { votacionesDelMvp, type VotacionDelMvp } from "../server/queries";
import { porcentajes } from "../server/services/quiniela";
import { cuandoCierra, yaVotaron } from "../server/services/textos";
import { BotonVotar } from "./boton-votar";

/** Cuántos candidatos se ven de entrada; el resto, en "Ver a todos" */
const VISIBLES = 5;

/**
 * Votaciones (pantalla 12 · PRD §6.7): el MVP de cada partido validado, un toque por voto. Antes de votar se
 * ven los candidatos con "VOTAR"; ya votado o cerrada, los porcentajes ("TU VOTO"). Votan compañeros y
 * aficionados con cuenta reclamada; nadie vota por sí mismo.
 */
export async function PaginaVotaciones({
  tournamentId,
  yo,
  miEquipoId,
  ahora,
}: {
  tournamentId: string;
  yo: string;
  miEquipoId: string | null;
  ahora: Date;
}) {
  const votaciones = await votacionesDelMvp(tournamentId, yo);
  const abiertas = votaciones.filter((v) => v.status === "ABIERTA" && v.closesAt > ahora);
  const esMio = (v: VotacionDelMvp) => v.match != null && (v.match.homeTeam.id === miEquipoId || v.match.awayTeam.id === miEquipoId);
  const orden = [...votaciones].sort((a, b) => Number(esMio(b)) - Number(esMio(a)));
  const votos = votaciones.reduce((s, v) => s + v.votesCount, 0);
  const jornada = votaciones[0]?.round?.numero;
  const cierre = abiertas[0]?.closesAt;

  return (
    <main className="flex flex-col gap-3.5 px-4 pt-2 pb-8 lg:max-w-6xl">
      <div className="flex flex-col gap-1">
        <Sobretitulo className="text-muted-foreground">
          {[jornada ? `Jornada ${jornada}` : null, cierre ? `cierran ${cuandoCierra(cierre, ahora)}` : votaciones.length ? "ya cerraron" : null, "votan compañeros y aficionados"]
            .filter(Boolean)
            .join(" · ")}
        </Sobretitulo>
        <h2 className="titular-momento text-[40px] leading-[0.9]">
          {abiertas.length ? (
            <>
              ¿Quién se la <span className="text-role">rifó</span>?
            </>
          ) : (
            <>
              Ya se <span className="text-role">votó</span>
            </>
          )}
        </h2>
        {votaciones.length > 0 && <p className="text-[13px] text-muted-foreground">{yaVotaron(votos)}</p>}
      </div>

      {!votaciones.length ? (
        <Tarjeta className="p-4 text-sm text-muted-foreground">
          Todavía no hay votaciones. Se abren solas cuando la liga valida cada partido: ahí votas al MVP.
        </Tarjeta>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {orden.map((v) => (
            <TarjetaMvp key={v.id} v={v} yo={yo} ahora={ahora} />
          ))}
        </div>
      )}

      <Tarjeta className="flex flex-col gap-1 p-3.5 text-[13px] text-muted-foreground">
        <Sobretitulo>Golazo, Once ideal y Atajada de la jornada</Sobretitulo>
        Llegan pronto: se votan cuando cierra la jornada.
      </Tarjeta>
    </main>
  );
}

function TarjetaMvp({ v, yo, ahora }: { v: VotacionDelMvp; yo: string; ahora: Date }) {
  const abierta = v.status === "ABIERTA" && v.closesAt > ahora;
  const miVoto = v.votes[0]?.optionId ?? null;
  const resultados = !abierta || miVoto != null;
  const pct = porcentajes(v.options.map((o) => o.votesCount));
  const conPct = v.options.map((o, i) => ({ ...o, pct: pct[i] }));
  // Antes de votar: primero los que hicieron algo (goles, asistencias, valla) y luego por nombre
  const opciones = resultados
    ? [...conPct].sort((a, b) => b.votesCount - a.votesCount || nombreVisible(a.user!).localeCompare(nombreVisible(b.user!), "es"))
    : [...conPct].sort((a, b) => Number(a.etiqueta === "Jugó") - Number(b.etiqueta === "Jugó") || nombreVisible(a.user!).localeCompare(nombreVisible(b.user!), "es"));
  const visibles = opciones.slice(0, VISIBLES);
  const resto = opciones.slice(VISIBLES);
  const m = v.match;
  const fila = (o: (typeof opciones)[number]) => (
    <Candidato key={o.id} o={o} pollId={v.id} yo={yo} abierta={abierta} resultados={resultados} miVoto={miVoto} ganador={v.winnerOptionId === o.id} />
  );

  return (
    <Tarjeta className="flex min-w-0 flex-col gap-2.5 p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-[22px] font-black uppercase italic leading-none">MVP del partido</h3>
        <span className="text-[11px] text-muted-foreground">{abierta ? (miVoto ? "Ya votaste" : "1 toque y listo") : "Cerrada"}</span>
      </div>
      {m && (
        <Link href={`/partido/${m.id}`} className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Escudo {...coloresDe(m.homeTeam)} tamano={16} conSiglas={false} />
          <span className="truncate">
            {nombreCorto(m.homeTeam.nombre)} {m.homeScore ?? 0}-{m.awayScore ?? 0} {nombreCorto(m.awayTeam.nombre)} · {abierta ? "¿quién fue el mejor?" : `${yaVotaron(v.votesCount).toLowerCase()}`}
          </span>
          <Escudo {...coloresDe(m.awayTeam)} tamano={16} conSiglas={false} />
        </Link>
      )}
      <ul className="flex flex-col gap-1.5">{visibles.map(fila)}</ul>
      {resto.length > 0 && (
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-[13px] font-semibold text-role">
            <span className="group-open:hidden">Ver a todos ({opciones.length})</span>
            <span className="hidden group-open:inline">Ver menos</span>
          </summary>
          <ul className="flex flex-col gap-1.5">{resto.map(fila)}</ul>
        </details>
      )}
    </Tarjeta>
  );
}

function Candidato({
  o,
  pollId,
  yo,
  abierta,
  resultados,
  miVoto,
  ganador,
}: {
  o: VotacionDelMvp["options"][number] & { pct: number };
  pollId: string;
  yo: string;
  abierta: boolean;
  resultados: boolean;
  miVoto: string | null;
  ganador: boolean;
}) {
  const nombre = o.user ? nombreVisible(o.user) : "Jugador";
  const mio = miVoto === o.id;
  return (
    <li className="relative flex min-h-14 items-center gap-3 overflow-hidden rounded-xl bg-surface-2 px-2.5 py-2">
      {resultados && (
        <span
          aria-hidden
          className={cn("absolute inset-y-0 left-0", mio || ganador ? "bg-role/20" : "bg-foreground/5")}
          style={{ width: `${o.pct}%` }}
        />
      )}
      <Iniciales nombre={nombre} tamano={40} className="relative" />
      <span className="relative min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-semibold">
          {o.user ? (
            <Link href={`/j/${o.user.username}`} className="truncate">
              {nombre}
            </Link>
          ) : (
            nombre
          )}
          {ganador && (
            <Chip tono="lima" className="shrink-0">
              <Star aria-hidden className="size-3" /> MVP
            </Chip>
          )}
        </span>
        <span className="block truncate text-[12px] text-muted-foreground">{o.etiqueta}</span>
      </span>
      <span className="relative flex shrink-0 flex-col items-end">
        {resultados ? (
          <>
            <span className={cn("font-display text-[22px] font-black italic leading-none", (mio || ganador) && "text-role")}>{o.pct}%</span>
            {mio && <span className="etiqueta text-[9px] tracking-[0.14em] text-role">Tu voto</span>}
          </>
        ) : o.userId === yo ? (
          <span className="etiqueta text-[11px] text-muted-foreground">Tú</span>
        ) : abierta ? (
          <BotonVotar pollId={pollId} optionId={o.id} nombre={nombre} />
        ) : null}
      </span>
    </li>
  );
}
