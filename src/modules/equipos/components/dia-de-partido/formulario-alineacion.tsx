"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { BotonLima } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { guardarAlineacion } from "../../server/actions";

type Estado = "titular" | "banca" | "fuera";
export type JugadorAlineable = {
  id: string;
  nombre: string;
  numero: number | null;
  va: boolean;
  bloqueado: boolean;
  alertas: { nivel: "ROJO" | "AMBAR"; titulo: string }[];
  inicial: Estado;
  capitan: boolean;
};

const ETIQUETA: Record<Estado, string> = { titular: "Titular", banca: "Banca", fuera: "No juega" };

/** Armar la alineación con los que van (pantalla 53): rojo no entra; ámbar avisa */
export function FormularioAlineacion({ matchId, teamId, jugadores, volver }: { matchId: string; teamId: string; jugadores: JugadorAlineable[]; volver: string }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Record<string, Estado>>(Object.fromEntries(jugadores.map((j) => [j.id, j.inicial])));
  const [capitan, setCapitan] = useState<string | null>(jugadores.find((j) => j.capitan)?.id ?? null);
  const [pendiente, startTransition] = useTransition();
  const titulares = Object.values(estado).filter((e) => e === "titular").length;
  const banca = Object.values(estado).filter((e) => e === "banca").length;

  function guardar() {
    const elegidos = jugadores.filter((j) => estado[j.id] !== "fuera");
    startTransition(async () => {
      const r = await guardarAlineacion({
        matchId,
        teamId,
        jugadores: elegidos.map((j) => ({ userId: j.id, titular: estado[j.id] === "titular", numero: j.numero, capitan: capitan === j.id })),
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Alineación lista. El árbitro ya la ve en su cédula.");
      router.push(volver);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {titulares} titulares · {banca} en la banca
      </p>
      <ul className="flex flex-col gap-2">
        {jugadores.map((j) => (
          <li key={j.id} className={cn("rounded-2xl border border-border bg-surface p-3", j.bloqueado && "opacity-70")}>
            <div className="flex items-center gap-2.5">
              <span className="font-display w-7 text-center text-[22px] font-black">{j.numero}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{j.nombre}</span>
                <span className="text-xs text-muted-foreground">{j.va ? "Dijo que va" : "No dijo que va"}</span>
              </span>
              <button
                type="button"
                aria-pressed={capitan === j.id}
                disabled={j.bloqueado || estado[j.id] === "fuera"}
                onClick={() => setCapitan((c) => (c === j.id ? null : j.id))}
                className={cn("etiqueta inline-flex size-11 items-center justify-center rounded-full border text-sm font-extrabold", capitan === j.id ? "border-transparent bg-brand-lime text-ink" : "border-border")}
                aria-label={`Capitán: ${j.nombre}`}
              >
                C
              </button>
            </div>
            {j.alertas.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {j.alertas.map((a) => (
                  <Chip key={a.titulo} tono={a.nivel === "ROJO" ? "rojo" : "ambar"}>
                    {a.titulo}
                  </Chip>
                ))}
              </div>
            )}
            <div role="group" aria-label={`Lugar de ${j.nombre}`} className="mt-2 grid grid-cols-3 gap-1.5">
              {(["titular", "banca", "fuera"] as const).map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-pressed={estado[j.id] === e}
                  disabled={j.bloqueado && e !== "fuera"}
                  onClick={() => setEstado((s) => ({ ...s, [j.id]: e }))}
                  className={cn(
                    "etiqueta min-h-10 rounded-lg text-xs font-extrabold tracking-[0.1em]",
                    estado[j.id] === e ? "bg-foreground text-background" : "bg-surface-2 text-muted-foreground",
                  )}
                >
                  {ETIQUETA[e]}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <BotonLima type="button" disabled={pendiente || titulares === 0} onClick={guardar} className="sticky bottom-[calc(96px+env(safe-area-inset-bottom))] w-full">
        {pendiente ? "Guardando…" : "Mandar alineación"}
      </BotonLima>
    </div>
  );
}
