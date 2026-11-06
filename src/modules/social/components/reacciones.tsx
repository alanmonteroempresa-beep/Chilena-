"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { reaccionar } from "../server/actions";

const TIPOS = [
  { tipo: "FUEGO", emoji: "🔥", nombre: "Fuego" },
  { tipo: "GOLAZO", emoji: "⚽", nombre: "Golazo" },
  { tipo: "TROFEO", emoji: "🏆", nombre: "Trofeo" },
] as const;

const corto = new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 });

/**
 * 🔥 Fuego · ⚽ Golazo · 🏆 Trofeo y 💬 (PRD §6.1). Optimista: se ve al instante y si falla regresa.
 * Una reacción por persona: tocar la misma la quita, otra la cambia.
 */
export function Reacciones({
  postId,
  conteos: iniciales,
  mia: miaInicial,
  comentarios,
  conSesion,
}: {
  postId: string;
  conteos: Record<string, number>;
  mia: string | null;
  comentarios: number;
  conSesion: boolean;
}) {
  const [conteos, setConteos] = useState(iniciales);
  const [mia, setMia] = useState(miaInicial);
  const [, startTransition] = useTransition();

  function tocar(tipo: string) {
    if (!conSesion) {
      toast("Entra para echarle porra", { description: "Con tu cuenta reaccionas, comentas y sigues a tus cracks." });
      return;
    }
    const antes = { conteos, mia };
    const nueva = mia === tipo ? null : tipo;
    const siguiente = { ...conteos };
    if (mia) siguiente[mia] = Math.max(0, (siguiente[mia] ?? 1) - 1);
    if (nueva) siguiente[nueva] = (siguiente[nueva] ?? 0) + 1;
    setConteos(siguiente);
    setMia(nueva);
    startTransition(async () => {
      const r = await reaccionar({ postId, tipo });
      if (!r.ok) {
        setConteos(antes.conteos);
        setMia(antes.mia);
        toast.error(r.error);
      }
    });
  }

  return (
    <>
      {TIPOS.map(({ tipo, emoji, nombre }) => {
        const n = conteos[tipo] ?? 0;
        const activa = mia === tipo;
        return (
          <button
            key={tipo}
            type="button"
            aria-pressed={activa}
            aria-label={`${nombre}${n ? `, ${n}` : ""}`}
            onClick={() => tocar(tipo)}
            className={cn(
              "inline-flex h-[30px] min-w-11 items-center justify-center gap-1 rounded-full px-2.5 text-[13px] font-semibold transition-colors",
              activa ? "bg-brand-lime text-ink" : "bg-surface-2",
            )}
          >
            <span aria-hidden>{emoji}</span>
            {n > 0 && <span className="tabular-nums">{corto.format(n)}</span>}
          </button>
        );
      })}
      <Link
        href={`/post/${postId}`}
        aria-label={`La porra${comentarios ? `, ${comentarios} comentarios` : ""}`}
        className="inline-flex h-[30px] min-w-11 items-center justify-center gap-1 rounded-full bg-surface-2 px-2.5 text-[13px] font-semibold"
      >
        <MessageCircle aria-hidden className="size-4" />
        {comentarios > 0 && <span className="tabular-nums">{corto.format(comentarios)}</span>}
      </Link>
    </>
  );
}
