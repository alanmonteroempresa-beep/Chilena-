"use client";

import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { BotonLima } from "@/shared/ui/button";
import { Escudo, type ColoresEquipo } from "@/shared/ui/escudo";
import { pronosticar } from "../server/actions";
import { ATAJOS, GOLES_MAXIMOS, type Marcador } from "../server/services/quiniela";

type Equipo = { nombre: string; colores: ColoresEquipo };

/** El marcador con +/– y los atajos (pantalla 13). "Mandar mi pronóstico · 2-1" */
export function Pronostico({
  matchId,
  local,
  visita,
  mio,
  cerrada,
}: {
  matchId: string;
  local: Equipo;
  visita: Equipo;
  mio: Marcador | null;
  cerrada: boolean;
}) {
  const [m, setM] = useState<Marcador>(mio ?? { local: 0, visita: 0 });
  const [enviado, setEnviado] = useState<Marcador | null>(mio);
  const [pendiente, startTransition] = useTransition();
  const igual = enviado != null && enviado.local === m.local && enviado.visita === m.visita;
  const texto = `${m.local}-${m.visita}`;
  const mover = (lado: keyof Marcador, d: number) =>
    setM((x) => ({ ...x, [lado]: Math.min(GOLES_MAXIMOS, Math.max(0, x[lado] + d)) }));

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1">
        <Lado e={local} goles={m.local} cerrada={cerrada} onMas={() => mover("local", 1)} onMenos={() => mover("local", -1)} />
        <span className="titular-momento text-[28px] text-role">vs</span>
        <Lado e={visita} goles={m.visita} cerrada={cerrada} onMas={() => mover("visita", 1)} onMenos={() => mover("visita", -1)} />
      </div>
      {!cerrada && (
        <div className="flex gap-2" role="group" aria-label="Marcadores rápidos">
          {ATAJOS.map((a) => {
            const activo = a.local === m.local && a.visita === m.visita;
            return (
              <button
                key={`${a.local}-${a.visita}`}
                type="button"
                aria-pressed={activo}
                onClick={() => setM(a)}
                className={cn(
                  "font-display min-h-11 min-w-12 rounded-lg border border-border px-2 text-[18px] font-black italic",
                  activo ? "bg-foreground text-background" : "bg-surface-2",
                )}
              >
                {a.local}-{a.visita}
              </button>
            );
          })}
        </div>
      )}
      {cerrada ? (
        <p className="etiqueta text-[12px] tracking-[0.14em] text-muted-foreground">{mio ? `Tu pronóstico: ${mio.local}-${mio.visita}` : "No pusiste pronóstico"}</p>
      ) : (
        <BotonLima
          className="w-full max-w-md"
          disabled={pendiente || igual}
          onClick={() =>
            startTransition(async () => {
              const r = await pronosticar({ matchId, local: m.local, visita: m.visita });
              if (!r.ok) return void toast.error(r.error);
              setEnviado(m);
              toast.success(`Listo: ${local.nombre} ${texto} ${visita.nombre}. Suerte.`);
            })
          }
        >
          {pendiente ? "Mandando…" : igual ? `Ya mandaste tu ${texto}` : `${enviado ? "Cambiar mi pronóstico" : "Mandar mi pronóstico"} · ${texto}`}
        </BotonLima>
      )}
    </div>
  );
}

function Lado({ e, goles, cerrada, onMas, onMenos }: { e: Equipo; goles: number; cerrada: boolean; onMas: () => void; onMenos: () => void }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <Escudo {...e.colores} tamano={44} />
      <span className="font-display max-w-full truncate text-[18px] font-black uppercase italic">{e.nombre}</span>
      <div className="flex items-center gap-0.5">
        {!cerrada && (
          <button type="button" aria-label={`Un gol menos a ${e.nombre}`} onClick={onMenos} className="grid size-11 place-items-center rounded-full bg-surface-2">
            <Minus aria-hidden className="size-4" />
          </button>
        )}
        <span className="titular-momento min-w-9 text-center text-[64px] leading-[0.85]" aria-live="polite">
          {goles}
        </span>
        {!cerrada && (
          <button type="button" aria-label={`Un gol más a ${e.nombre}`} onClick={onMas} className="grid size-11 place-items-center rounded-full bg-surface-2">
            <Plus aria-hidden className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
