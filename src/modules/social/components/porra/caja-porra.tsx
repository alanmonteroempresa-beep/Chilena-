"use client";

import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { comentarioSchema } from "../../schemas";
import { comentar } from "../../server/actions";

/** "Échale porra…" (pantallas 05 y 35): carrilla sí; insultos, amenazas y discriminación no (§8.9) */
export function CajaPorra({ postId, muroDe, conSesion }: { postId?: string; muroDe?: string; conSesion: boolean }) {
  const [texto, setTexto] = useState("");
  const [pendiente, startTransition] = useTransition();
  const campo = useRef<HTMLTextAreaElement>(null);
  if (!conSesion) {
    return <p className="rounded-xl bg-surface-2 p-3 text-sm text-muted-foreground">Entra para echarle porra.</p>;
  }
  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const r = comentarioSchema.safeParse({ postId, muroDe, texto });
    if (!r.success) return toast.error(r.error.issues[0]?.message ?? "Revisa tu comentario.");
    startTransition(async () => {
      const res = await comentar({ postId, muroDe, texto });
      if (!res.ok) toast.error(res.error);
      else {
        setTexto("");
        campo.current?.blur();
      }
    });
  }
  return (
    <form onSubmit={enviar} className="flex items-end gap-2">
      <label htmlFor={`porra-${postId ?? muroDe}`} className="sr-only">
        Échale porra
      </label>
      <textarea
        ref={campo}
        id={`porra-${postId ?? muroDe}`}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={1}
        maxLength={500}
        placeholder="Échale porra…"
        className="min-h-11 flex-1 resize-none rounded-xl border border-input bg-surface px-3 py-2.5 text-[15px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-surface-2"
      />
      <button
        type="submit"
        disabled={pendiente || !texto.trim()}
        aria-label="Publicar en la porra"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-lime text-ink disabled:bg-surface-2 disabled:text-muted-foreground"
      >
        <Send aria-hidden className="size-5" />
      </button>
    </form>
  );
}
