import Link from "next/link";
import { nombreCorto, nombreVisible } from "@/shared/lib/personas";
import { cn } from "@/shared/lib/utils";
import { Iniciales } from "@/shared/ui/iniciales";
import { Tarjeta } from "@/shared/ui/tarjeta";
import type { datosGoleo } from "../../server/mi-liga";

type Datos = NonNullable<Awaited<ReturnType<typeof datosGoleo>>>;

/** Goleo del torneo (Mi liga → Goleo): solo cédulas validadas; los empates comparten lugar */
export function GoleoCompleto({ d, yo }: { d: Datos; yo: string }) {
  return (
    <main className="flex flex-col gap-2 px-4 pt-3 pb-6">
      <Tarjeta>
        <ol className="divide-y divide-border">
          {d.goleo.map((g) => {
            const soyYo = g.userId === yo;
            return (
              <li key={g.userId}>
                <Link href={`/j/${g.user.username}`} className={cn("flex min-h-14 items-center gap-3 px-3.5 py-2", soyYo && "bg-role/10")}>
                  <span className="font-display w-6 text-center text-[18px] font-black text-muted-foreground">{g.posicion}</span>
                  <Iniciales nombre={nombreVisible(g.user)} tamano={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {nombreVisible(g.user)}
                      {soyYo ? " · tú" : ""}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[g.equipo ? nombreCorto(g.equipo.nombre) : null, `${g.partidos} PJ`, g.asistencias ? `${g.asistencias} asist.` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className={cn("font-display text-[26px] leading-none font-black", soyYo && "text-role")}>{g.goles}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </Tarjeta>
    </main>
  );
}
