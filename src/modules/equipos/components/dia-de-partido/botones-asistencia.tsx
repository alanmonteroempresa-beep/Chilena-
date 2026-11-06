"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import { contestarPaseDeLista } from "../../server/actions";

/**
 * "CONFIRMO QUE VOY / NO VOY" en el inicio del jugador (pantalla 03 · PRD §7.6). Optimista: se ve al
 * instante (y el conteo "11/16 ya confirmaron") y regresa si falla.
 */
export function BotonesAsistencia({
  matchId,
  respuesta: inicial,
  van: vanInicial,
  convocados,
}: {
  matchId: string;
  respuesta: string | null;
  van: number;
  convocados: number;
}) {
  const [respuesta, setRespuesta] = useState(inicial);
  const [van, setVan] = useState(vanInicial);
  const [, startTransition] = useTransition();
  const va = respuesta === "VA";
  const noVa = respuesta === "NO_VA" || respuesta === "LESIONADO";

  function contestar(nueva: "VA" | "NO_VA") {
    if (nueva === respuesta) return;
    const antes = { respuesta, van };
    setRespuesta(nueva);
    setVan((n) => n + (nueva === "VA" ? 1 : 0) - (respuesta === "VA" ? 1 : 0));
    startTransition(async () => {
      const r = await contestarPaseDeLista({ matchId, respuesta: nueva });
      if (!r.ok) {
        setRespuesta(antes.respuesta);
        setVan(antes.van);
        toast.error(r.error);
      }
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={va}
          onClick={() => contestar("VA")}
          className={buttonVariants({ variant: "lima", size: "cta", className: "h-11 flex-1 px-3" })}
        >
          {va && <Check aria-hidden />}
          {va ? "Ya confirmaste" : "Confirmo que voy"}
        </button>
        <button
          type="button"
          aria-pressed={noVa}
          onClick={() => contestar("NO_VA")}
          className={cn(
            "etiqueta inline-flex h-11 items-center gap-1.5 rounded-xl border-[1.5px] px-3.5 text-sm font-extrabold tracking-[0.14em] uppercase",
            noVa ? "border-white bg-white text-ink" : "border-white/50 text-white",
          )}
        >
          {noVa && <Check aria-hidden className="size-4" />}
          No voy
        </button>
      </div>
      <span className="text-xs text-white/75">
        {van}/{convocados} ya confirmaron
      </span>
    </>
  );
}
