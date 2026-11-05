"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Mail, MailCheck, TriangleAlert } from "lucide-react";
import { BotonLima, Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { entrarSchema } from "../../schemas";
import { pedirLinkMagico, type EstadoEntrar } from "../../server/actions";

type Props = {
  next?: string;
  /** Aviso que trae la URL (link vencido, etc.). Se quita en cuanto se manda un link nuevo. */
  aviso?: string | null;
};

/** Pantalla 01 · link mágico al correo. Se vuelve a montar con "Usar otro correo". */
export function FormularioCorreo({ next, aviso }: Props) {
  const [intento, setIntento] = useState(0);
  return (
    <Formulario
      key={intento}
      next={next}
      aviso={intento === 0 ? aviso : null}
      enfocar={intento > 0}
      otroCorreo={() => setIntento((i) => i + 1)}
    />
  );
}

function Formulario({
  next,
  aviso,
  enfocar,
  otroCorreo,
}: Props & { enfocar: boolean; otroCorreo: () => void }) {
  const [estado, accion, enviando] = useActionState<EstadoEntrar, FormData>(pedirLinkMagico, {
    estado: "inicial",
  });
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const campo = useRef<HTMLInputElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  // Al mandar el link el formulario desaparece: el foco pasa a "Revisa tu correo"
  useEffect(() => {
    if (estado.estado === "enviado") titulo.current?.focus();
  }, [estado]);

  if (estado.estado === "enviado") {
    return (
      <div className="flex flex-col gap-4" role="status">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface-2 text-foreground">
            <MailCheck aria-hidden className="size-6" />
          </span>
          <h3 ref={titulo} tabIndex={-1} className="titular-momento text-[34px] leading-[0.9] outline-none">
            Revisa tu correo
          </h3>
        </div>
        <p className="text-[15px] leading-snug text-muted-foreground">
          Te mandamos un link a <strong className="font-semibold text-foreground">{estado.email}</strong>.
          Ábrelo en este mismo navegador y entras directo.
        </p>
        <p className="text-sm text-muted-foreground">
          ¿No te llegó? Revisa la carpeta de spam o pide otro en un minuto.
        </p>
        <form action={accion}>
          <input type="hidden" name="email" value={estado.email} />
          {next && <input type="hidden" name="next" value={next} />}
          <Button
            type="submit"
            variant="quieto"
            size="cta"
            disabled={enviando}
            className="w-full border border-input"
          >
            {enviando ? "Mandando…" : "Mandar otro link"}
          </Button>
        </form>
        <Button variant="quieto" size="cta" className="text-muted-foreground" onClick={otroCorreo}>
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
          campo.current?.focus();
        } else setErrorLocal(null);
      }}
    >
      {aviso && estado.estado === "inicial" && (
        <p
          role="alert"
          className="flex gap-2.5 rounded-xl bg-warning-soft p-3 text-sm leading-snug font-medium text-warning"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {aviso}
        </p>
      )}
      <label htmlFor="email" className="text-sm font-semibold">
        Tu correo
      </label>
      <Input
        ref={campo}
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        autoFocus={enfocar}
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
