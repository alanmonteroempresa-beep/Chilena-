"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { reportar } from "../../server/actions";

const MOTIVOS = [
  ["INSULTO", "Insulto"],
  ["AMENAZA", "Amenaza"],
  ["DISCRIMINACION", "Discriminación"],
  ["OTRO", "Otra cosa"],
] as const;

/** Reportar un comentario (regla 10): la liga lo revisa y lo oculta si se pasó */
export function BotonReportar({ comentarioId }: { comentarioId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [, startTransition] = useTransition();
  function elegir(motivo: (typeof MOTIVOS)[number][0]) {
    setAbierto(false);
    startTransition(async () => {
      const r = await reportar({ comentarioId, motivo });
      if (r.ok) toast("Gracias, la liga lo va a revisar.");
      else toast.error(r.error);
    });
  }
  return (
    <span className="relative">
      <button
        type="button"
        aria-expanded={abierto}
        aria-label="Reportar comentario"
        onClick={() => setAbierto((a) => !a)}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground"
      >
        <Flag aria-hidden className="size-3.5" />
      </button>
      {abierto && (
        <span role="menu" className="absolute top-8 right-0 z-10 flex w-40 flex-col rounded-xl border border-border bg-popover p-1 shadow-lg">
          {MOTIVOS.map(([m, texto]) => (
            <button key={m} type="button" role="menuitem" onClick={() => elegir(m)} className="min-h-10 rounded-lg px-3 text-left text-sm hover:bg-surface-2">
              {texto}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
