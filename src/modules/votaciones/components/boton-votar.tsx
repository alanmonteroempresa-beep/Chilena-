"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { votar } from "../server/actions";

/** "VOTAR" (pantalla 12): un toque y listo */
export function BotonVotar({ pollId, optionId, nombre }: { pollId: string; optionId: string; nombre: string }) {
  const [pendiente, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pendiente}
      aria-label={`Votar por ${nombre}`}
      className="etiqueta min-h-11 rounded-lg px-3 text-[13px] font-extrabold tracking-[0.14em] text-role disabled:opacity-60"
      onClick={() =>
        startTransition(async () => {
          const r = await votar({ pollId, optionId });
          if (!r.ok) return void toast.error(r.error);
          toast.success(`Listo: votaste por ${nombre}.`);
        })
      }
    >
      {pendiente ? "…" : "Votar"}
    </button>
  );
}
