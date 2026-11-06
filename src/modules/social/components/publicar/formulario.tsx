"use client";

import { useActionState, useState } from "react";
import { ImagePlus, Send } from "lucide-react";
import { BotonLima } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { publicar, type EstadoPublicar } from "../../server/actions";

/** Publicar (pantalla 34 · PRD §6.2): texto de fútbol; fotos y videos llegan después (flag media.posts) */
export function FormularioPublicar({ conMedia }: { conMedia: boolean }) {
  const [estado, accion, publicando] = useActionState<EstadoPublicar, FormData>(publicar, { estado: "inicial" });
  const [texto, setTexto] = useState(estado.estado === "error" ? estado.texto : "");
  return (
    <form action={accion} className="flex flex-col gap-3">
      <label htmlFor="publicar-texto" className="sr-only">
        ¿Qué pasó en la cancha?
      </label>
      <textarea
        id="publicar-texto"
        name="texto"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={6}
        maxLength={500}
        autoFocus
        placeholder="¿Qué pasó en la cancha? Carrilla sí; insultos no."
        aria-invalid={estado.estado === "error"}
        aria-describedby={estado.estado === "error" ? "publicar-error" : undefined}
        className="min-h-40 resize-none rounded-2xl border border-input bg-surface p-4 text-[16px] leading-snug outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-surface-2"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <ImagePlus aria-hidden className="size-4" />
          Fotos y videos {!conMedia && <Chip>Próximamente</Chip>}
        </span>
        <span className="tabular-nums">{texto.length}/500</span>
      </div>
      {estado.estado === "error" && (
        <p id="publicar-error" role="alert" className="text-sm font-medium text-danger">
          {estado.mensaje}
        </p>
      )}
      <BotonLima type="submit" disabled={publicando || !texto.trim()} className="w-full">
        <Send aria-hidden />
        {publicando ? "Publicando…" : "Publicar"}
      </BotonLima>
    </form>
  );
}
