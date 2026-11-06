"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { contestarPorLink } from "../../server/actions";

type Jugador = { id: string; nombre: string; numero: number | null; respuesta: string };

/** "¿Quién eres?" → VOY / NO VOY (pantalla 20): sin cuenta y sin descargar nada */
export function ContestarLink({ token, jugadores, delegado }: { token: string; jugadores: Jugador[]; delegado: string }) {
  const [yo, setYo] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();
  const elegido = jugadores.find((j) => j.id === yo);

  function contestar(respuesta: "VA" | "NO_VA") {
    if (!yo) return;
    startTransition(async () => {
      const r = await contestarPorLink({ token, userId: yo, respuesta });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setListo(respuesta);
    });
  }

  if (listo && elegido) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-5 text-center">
        <Check aria-hidden className="size-10 text-success" />
        <p className="titular-momento text-[34px]">{listo === "VA" ? "¡Ahí nos vemos!" : "Va, ni modo"}</p>
        <p className="text-sm text-muted-foreground">
          {elegido.nombre}, {delegado} ya ve tu respuesta. Si cambias de opinión, vuelve a este link.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="etiqueta mb-2 text-xs font-extrabold tracking-[0.14em] text-muted-foreground">¿Quién eres?</legend>
        <div className="flex flex-wrap gap-2">
          {jugadores.map((j) => (
            <button
              key={j.id}
              type="button"
              aria-pressed={yo === j.id}
              onClick={() => setYo(j.id)}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold",
                yo === j.id ? "border-transparent bg-foreground text-background" : "border-border bg-surface",
              )}
            >
              {j.numero != null && <span className="font-display font-black">{j.numero}</span>}
              {j.nombre}
              {j.respuesta === "VA" && <Check aria-label="ya dijo que va" className="size-3.5 text-success" />}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={!yo || pendiente}
          onClick={() => contestar("VA")}
          className="titular-momento flex min-h-28 flex-col items-center justify-center rounded-2xl bg-brand-lime text-[44px] text-ink disabled:opacity-50"
        >
          <span aria-hidden className="text-[26px] not-italic">👍</span>
          Voy
        </button>
        <button
          type="button"
          disabled={!yo || pendiente}
          onClick={() => contestar("NO_VA")}
          className="titular-momento flex min-h-28 flex-col items-center justify-center rounded-2xl border border-border bg-surface text-[44px] disabled:opacity-50"
        >
          <span aria-hidden className="text-[26px] not-italic">✋</span>
          No voy
        </button>
      </div>
    </div>
  );
}
