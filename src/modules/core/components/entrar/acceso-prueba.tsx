"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FlaskConical, KeyRound } from "lucide-react";
import { BotonLima, Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cuentaDePruebaSchema, DOMINIO_CUENTAS_DE_PRUEBA } from "../../schemas";
import { entrarConCuentaDePrueba, type EstadoCuentaDePrueba } from "../../server/actions";

/**
 * "Entrar con cuenta de prueba" (flag `auth.demo_login`, dev y beta interna). Solo entra con las cuentas que
 * crea scripts/cuentas-de-prueba.ts: no hay registro con contraseña.
 */
export function AccesoPrueba({ next }: { next?: string }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, entrando] = useActionState<EstadoCuentaDePrueba, FormData>(entrarConCuentaDePrueba, {
    estado: "inicial",
  });
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const correo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierto) correo.current?.focus();
  }, [abierto]);

  if (!abierto) {
    return (
      <Button
        variant="quieto"
        size="cta"
        className="w-full border border-dashed border-input text-muted-foreground normal-case tracking-normal font-sans text-[15px] font-semibold"
        aria-expanded={false}
        aria-controls="acceso-prueba"
        onClick={() => setAbierto(true)}
      >
        <FlaskConical aria-hidden />
        Entrar con cuenta de prueba
      </Button>
    );
  }

  const error = errorLocal ?? (estado.estado === "error" ? estado.mensaje : null);
  return (
    <form
      id="acceso-prueba"
      action={accion}
      noValidate
      className="flex flex-col gap-3 rounded-xl border border-dashed border-input p-4"
      onSubmit={(e) => {
        const f = new FormData(e.currentTarget);
        const r = cuentaDePruebaSchema.safeParse({ email: f.get("email"), password: f.get("password") });
        if (!r.success) {
          e.preventDefault();
          setErrorLocal(r.error.issues[0]?.message ?? null);
        } else setErrorLocal(null);
      }}
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <FlaskConical aria-hidden className="size-4 text-muted-foreground" />
        Cuenta de prueba
        <span className="etiqueta rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] tracking-[0.12em] text-muted-foreground">
          Beta interna
        </span>
      </p>
      <label htmlFor="prueba-email" className="text-sm font-semibold">
        Correo
      </label>
      <Input
        ref={correo}
        id="prueba-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder={`alan@${DOMINIO_CUENTAS_DE_PRUEBA}`}
        defaultValue={estado.estado === "error" ? estado.email : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "prueba-error" : undefined}
        className="h-12 rounded-xl bg-surface px-4 text-base md:text-base dark:bg-surface-2"
      />
      <label htmlFor="prueba-password" className="text-sm font-semibold">
        Contraseña
      </label>
      <Input
        id="prueba-password"
        name="password"
        type="password"
        autoComplete="current-password"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "prueba-error" : undefined}
        className="h-12 rounded-xl bg-surface px-4 text-base md:text-base dark:bg-surface-2"
      />
      {next && <input type="hidden" name="next" value={next} />}
      {error && (
        <p id="prueba-error" role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <BotonLima type="submit" disabled={entrando} className="w-full">
        <KeyRound aria-hidden />
        {entrando ? "Entrando…" : "Entrar"}
      </BotonLima>
    </form>
  );
}
