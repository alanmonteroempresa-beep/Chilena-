import Link from "next/link";
import { diaDeLaJornada, horaCDMX } from "@/modules/partidos";
import { nombreCorto, nombreDeArbitro } from "@/shared/lib/personas";
import { cn } from "@/shared/lib/utils";
import { Chip } from "@/shared/ui/chip";
import { coloresDe, Escudo } from "@/shared/ui/escudo";
import { Tarjeta } from "@/shared/ui/tarjeta";
import type { datosRolDeJuegos } from "../../server/mi-liga";
import { ChipsJornada } from "./chips-jornada";

type Datos = NonNullable<Awaited<ReturnType<typeof datosRolDeJuegos>>>;

/**
 * Rol de juegos en lectura (pantalla 45 · celular): jornada por jornada con hora, cancha y árbitro.
 * Lo jugado sale con su marcador OFICIAL (cédula validada, regla 1); cada partido abre su página (32).
 */
export function RolDeJuegos({ d }: { d: Datos }) {
  const dia = d.partidos[0]?.scheduledAt ? diaDeLaJornada(d.partidos[0].scheduledAt) : null;
  return (
    <main className="flex flex-col gap-3 px-4 pt-3 pb-6">
      <ChipsJornada jornadas={d.jornadas} actual={d.jornada} siguiente={d.siguiente} />
      <p className="text-xs text-muted-foreground">
        {dia ? `${dia.charAt(0)}${dia.slice(1).toLowerCase()} · ` : ""}
        {d.partidos.length} {d.partidos.length === 1 ? "partido" : "partidos"}
        {d.jornada === d.siguiente ? " · la que viene" : ""}
      </p>
      <Tarjeta>
        <ul className="divide-y divide-border">
          {d.partidos.map((p) => {
            const mio = d.miEquipo && (p.homeTeam.id === d.miEquipo.id || p.awayTeam.id === d.miEquipo.id);
            const validado = p.status === "VALIDADO";
            return (
              <li key={p.id}>
                <Link href={`/partido/${p.id}`} className={cn("flex min-h-16 items-center gap-3 px-3.5 py-2.5", mio && "bg-role/10")}>
                  <span className="font-display w-14 shrink-0 text-[22px] leading-none font-black">
                    {p.scheduledAt ? horaCDMX(p.scheduledAt) : "—"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <Escudo {...coloresDe(p.homeTeam)} tamano={14} conSiglas={false} />
                      <span className="truncate">
                        {nombreCorto(p.homeTeam.nombre)}
                        {validado ? ` ${p.homeScore}–${p.awayScore} ` : " vs "}
                        {nombreCorto(p.awayTeam.nombre)}
                      </span>
                      <Escudo {...coloresDe(p.awayTeam)} tamano={14} conSiglas={false} />
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {p.field?.nombre}
                      {" · "}
                      {p.referee ? nombreDeArbitro(p.referee) : <span className="font-semibold text-warning">Sin árbitro</span>}
                    </span>
                  </span>
                  {validado ? (
                    <Chip tono="verde">Oficial</Chip>
                  ) : p.status === "PROGRAMADO" ? (
                    <Chip>Programado</Chip>
                  ) : (
                    <Chip tono="ambar">Por validar</Chip>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </Tarjeta>
    </main>
  );
}
