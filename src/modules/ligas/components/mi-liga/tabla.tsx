import { cn } from "@/shared/lib/utils";
import { coloresDe, Escudo } from "@/shared/ui/escudo";
import { Tarjeta } from "@/shared/ui/tarjeta";
import type { datosTabla } from "../../server/mi-liga";

type Datos = NonNullable<Awaited<ReturnType<typeof datosTabla>>>;

const RACHA: Record<string, string> = { G: "bg-success", E: "bg-brand-silver", P: "bg-danger" };

/**
 * Tabla completa (Mi liga → Tabla · PRD §7.13): sale de `calcularTabla` con lo VALIDADO (regla 2).
 * Empates sin resolver comparten lugar; la línea marca la zona de liguilla.
 */
export function TablaCompleta({ d }: { d: Datos }) {
  const liguilla = d.torneo.equiposLiguilla ?? 0;
  return (
    <main className="flex flex-col gap-2 px-4 pt-3 pb-6">
      <Tarjeta className="overflow-hidden">
        <table className="w-full text-[13px]">
          <caption className="sr-only">Tabla del {d.torneo.nombre}</caption>
          <thead>
            <tr className="etiqueta text-[10px] tracking-[0.12em] text-muted-foreground">
              <th scope="col" className="w-7 py-2 pl-3 text-left font-bold">#</th>
              <th scope="col" className="py-2 text-left font-bold">Equipo</th>
              <th scope="col" className="w-7 text-right font-bold">PJ</th>
              <th scope="col" className="w-6 text-right font-bold">G</th>
              <th scope="col" className="w-6 text-right font-bold">E</th>
              <th scope="col" className="w-6 text-right font-bold">P</th>
              <th scope="col" className="w-9 text-right font-bold">DG</th>
              <th scope="col" className="w-10 pr-3 text-right font-bold">PTS</th>
            </tr>
          </thead>
          <tbody>
            {d.tabla.map((f, i) => {
              const mio = d.miEquipo?.id === f.tournamentTeam.team.id;
              const corte = liguilla > 0 && i === liguilla - 1 && i < d.tabla.length - 1;
              return (
                <tr
                  key={f.tournamentTeam.team.id}
                  className={cn("h-12 border-t border-border", mio && "bg-role/10 font-semibold", corte && "border-b-2 border-b-brand-lime")}
                >
                  <td className="pl-3 etiqueta text-muted-foreground">{f.posicion}</td>
                  <td className="max-w-0">
                    <span className="flex items-center gap-2">
                      <Escudo {...coloresDe(f.tournamentTeam.team)} tamano={16} conSiglas={false} />
                      <span className="truncate">{f.tournamentTeam.team.nombre}</span>
                    </span>
                    {f.racha && (
                      <span className="mt-1 flex gap-0.5" aria-label={`Últimos partidos: ${f.racha}`}>
                        {f.racha.split("").map((r, j) => (
                          <span key={j} aria-hidden className={cn("size-1.5 rounded-full", RACHA[r] ?? "bg-surface-2")} />
                        ))}
                      </span>
                    )}
                  </td>
                  <td className="etiqueta text-right text-muted-foreground">{f.pj}</td>
                  <td className="etiqueta text-right text-muted-foreground">{f.pg}</td>
                  <td className="etiqueta text-right text-muted-foreground">{f.pe}</td>
                  <td className="etiqueta text-right text-muted-foreground">{f.pp}</td>
                  <td className="etiqueta text-right text-muted-foreground">{f.dg > 0 ? `+${f.dg}` : f.dg}</td>
                  <td className={cn("pr-3 text-right font-display text-[18px] font-black", mio && "text-role")}>{f.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Tarjeta>
      {liguilla > 0 && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden className="h-0.5 w-5 bg-brand-lime" />
          Los primeros {liguilla} van a la liguilla
        </p>
      )}
    </main>
  );
}
