"use client";

import { useActionState, useState } from "react";
import { Mail, MailCheck } from "lucide-react";
import { BotonLima, Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { entrarSchema } from "../../schemas";
import { pedirLinkMagico, type EstadoEntrar } from "../../server/actions";

/** Pantalla 01 · link mágico al correo. Se vuelve a montar con "Usar otro correo". */
export function FormularioCorreo({ next }: { next?: string }) {
  const [intento, setIntento] = useState(0);
  return <Formulario key={intento} next={next} otroCorreo={() => setIntento((i) => i + 1)} />;
}

function Formulario({ next, otroCorreo }: { next?: string; otroCorreo: () => void }) {
  const [estado, accion, enviando] = useActionState<EstadoEntrar, FormData>(pedirLinkMagico, {
    estado: "inicial",
  });
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  if (estado.estado === "enviado") {
    return (
      <div className="flex flex-col gap-4" role="status" aria-live="polite">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-lime text-ink">
            <MailCheck aria-hidden className="size-6" />
          </span>
          <p className="titular-momento text-[34px] leading-[0.9]">Revisa tu correo</p>
        </div>
        <p className="text-[15px] leading-snug text-muted-foreground">
          Te mandamos un link a <strong className="font-semibold text-foreground">{estado.email}</strong>.
          Ábrelo desde este celular y entras directo.
        </p>
        <p className="text-sm text-muted-foreground">
          ¿No te llegó? Revisa la carpeta de spam o pide otro en un minuto.
        </p>
        <Button variant="quieto" size="cta" className="border border-border" onClick={otroCorreo}>
          Usar otro correo
        </Button>
      </div>
    );
  }

  const error = errorLocal ?? (estado.estado === "error" ? estado.mensaje : null);
  return (
    <form
      action={accion}
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        // El mismo esquema Zod que la Server Action
        const r = entrarSchema.safeParse({ email: new FormData(e.currentTarget).get("email") });
        if (!r.success) {
          e.preventDefault();
          setErrorLocal(r.error.issues[0]?.message ?? null);
        } else setErrorLocal(null);
      }}
    >
      <label htmlFor="email" className="text-sm font-semibold">
        Tu correo
      </label>
      <Input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="tucorreo@gmail.com"
        defaultValue={estado.estado === "error" ? estado.email : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "email-error" : undefined}
        className="h-14 rounded-xl bg-surface px-4 text-lg font-medium md:text-lg dark:bg-surface-2"
      />
      {next && <input type="hidden" name="next" value={next} />}
      {error && (
        <p id="email-error" role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <BotonLima type="submit" disabled={enviando} className="mt-1 w-full">
        <Mail aria-hidden />
        {enviando ? "Mandando…" : "Mandar link a mi correo"}
      </BotonLima>
    </form>
  );
}
