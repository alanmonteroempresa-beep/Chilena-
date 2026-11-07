"use client";

import { useTransition } from "react";
import { CheckCheck, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { BotonLima, Button } from "@/shared/ui/button";
import { validarCedula, validarListas } from "../../server/actions";

/** "VALIDAR RESULTADO" (pantalla 46) */
export function BotonValidar({ matchId, listo }: { matchId: string; listo: boolean }) {
  const [pendiente, startTransition] = useTransition();
  return (
    <BotonLima
      className="w-full lg:w-auto"
      disabled={!listo || pendiente}
      onClick={() =>
        startTransition(async () => {
          const r = await validarCedula({ matchId });
          if (!r.ok) return void toast.error(r.error);
          toast.success(`Validado. Ya cuenta para la tabla${r.sanciones ? ` y salieron ${r.sanciones === 1 ? "una sanción" : `${r.sanciones} sanciones`}` : ""}.`);
        })
      }
    >
      <CircleCheck aria-hidden />
      {pendiente ? "Validando…" : "Validar resultado"}
    </BotonLima>
  );
}

/** "VALIDAR LAS LISTAS (N)": todas las firmadas por los dos */
export function BotonValidarListas({ tournamentId, listas }: { tournamentId: string; listas: number }) {
  const [pendiente, startTransition] = useTransition();
  return (
    <Button
      variant="quieto"
      size="cta"
      className="w-full border border-border"
      disabled={pendiente}
      onClick={() =>
        startTransition(async () => {
          const r = await validarListas({ tournamentId });
          if (!r.ok) return void toast.error(r.error);
          toast.success(r.validadas === 1 ? "Validé la cédula lista." : `Validé ${r.validadas} cédulas listas.`);
        })
      }
    >
      <CheckCheck aria-hidden />
      {pendiente ? "Validando…" : `Validar las listas (${listas})`}
    </Button>
  );
}
