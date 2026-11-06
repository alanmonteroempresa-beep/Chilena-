"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { CartaCrack } from "@/shared/ui/carta-crack";

type PropsCarta = Omit<React.ComponentProps<typeof CartaCrack>, "lado" | "ancho" | "className">;

/**
 * La carta en grande (pantalla 25a): "la primera se voltea de verdad: tócala". Frente y reverso con un
 * control segmentado para quien no toca la carta. Sin animación si el celular pide menos movimiento.
 */
export function CartaVolteable({ carta, ancho = 260 }: { carta: PropsCarta; ancho?: number }) {
  const [reverso, setReverso] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      <div role="group" aria-label="Lado de la carta" className="inline-flex rounded-lg border border-border bg-surface p-0.5">
        {(["Frente", "Reverso"] as const).map((lado) => {
          const activo = (lado === "Reverso") === reverso;
          return (
            <button
              key={lado}
              type="button"
              aria-pressed={activo}
              onClick={() => setReverso(lado === "Reverso")}
              className={cn(
                "etiqueta min-h-9 rounded-md px-3 text-[11px] font-extrabold tracking-[0.14em]",
                activo ? "bg-brand-lime text-ink" : "text-muted-foreground",
              )}
            >
              {lado}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setReverso((r) => !r)}
        aria-label={reverso ? "Ver el frente de la carta" : "Ver el reverso de la carta"}
        className="relative [perspective:1200px]"
        style={{ width: ancho, height: (ancho * 368) / 260 }}
      >
        <span
          className="absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none"
          style={{ transform: reverso ? "rotateY(180deg)" : "none" }}
        >
          <span className="absolute inset-0 [backface-visibility:hidden]">
            <CartaCrack {...carta} lado="frente" ancho={ancho} />
          </span>
          <span className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <CartaCrack {...carta} lado="reverso" ancho={ancho} />
          </span>
        </span>
      </button>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <RefreshCw aria-hidden className="size-3.5" />
        Toca la carta para voltearla
      </span>
    </div>
  );
}
