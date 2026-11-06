"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/utils";

/** Jornadas del rol (J1 … J18) en una fila que se desliza; la elegida queda a la vista */
export function ChipsJornada({
  jornadas,
  actual,
  siguiente,
}: {
  jornadas: { numero: number; nombre: string | null; fase: string }[];
  actual: number | null;
  siguiente: number | null;
}) {
  const elegida = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    elegida.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [actual]);
  return (
    <nav aria-label="Jornadas" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {jornadas.map((j) => {
        const activa = j.numero === actual;
        const texto = j.fase === "REGULAR" ? `J${j.numero}` : (j.nombre ?? `J${j.numero}`);
        return (
          <Link
            key={j.numero}
            ref={activa ? elegida : undefined}
            href={`/mi-liga/rol?j=${j.numero}`}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "etiqueta inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 text-xs font-extrabold tracking-[0.12em]",
              activa ? "border-transparent bg-foreground text-background" : "border-border bg-surface text-muted-foreground",
            )}
          >
            {texto}
            {j.numero === siguiente && !activa ? " ·" : ""}
          </Link>
        );
      })}
    </nav>
  );
}
