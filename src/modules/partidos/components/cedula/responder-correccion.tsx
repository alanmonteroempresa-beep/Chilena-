"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { BotonLima, Button } from "@/shared/ui/button";
import { responderCorreccion } from "../../server/actions";

/** ACEPTAR / RECHAZAR una corrección (pantalla 19, celular del árbitro) */
export function BotonesRespuesta({ correctionId }: { correctionId: string }) {
  const [pendiente, startTransition] = useTransition();
  const responder = (aceptar: boolean) =>
    startTransition(async () => {
      const r = await responderCorreccion({ correctionId, aceptar });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(aceptar ? "Corregida. Los delegados vuelven a firmar." : "Rechazada. Le avisamos al delegado.");
    });
  return (
    <div className="grid grid-cols-2 gap-2">
      <BotonLima disabled={pendiente} onClick={() => responder(true)}>
        <Check aria-hidden />
        Aceptar
      </BotonLima>
      <Button variant="quieto" size="cta" className="border border-border text-danger" disabled={pendiente} onClick={() => responder(false)}>
        <X aria-hidden />
        Rechazar
      </Button>
    </div>
  );
}
