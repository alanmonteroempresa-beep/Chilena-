"use client";

import { useTransition } from "react";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/shared/ui/button";
import { abrirPaseDeLista } from "../../server/actions";

const wa = (texto: string) => `https://wa.me/?text=${encodeURIComponent(texto)}`;

/**
 * Mandar el pase de lista al grupo y el recordatorio a los que no contestan (pantallas 04 y 20).
 * Contactar = abrir WhatsApp (CLAUDE.md): Chilena no manda mensajes.
 */
export function CompartirPaseDeLista({
  matchId,
  teamId,
  sinContestar,
}: {
  matchId: string;
  teamId: string;
  sinContestar: string[];
}) {
  const [pendiente, startTransition] = useTransition();
  function link(recordatorio: boolean) {
    // Abrir la ventana antes de esperar al servidor: los navegadores bloquean popups que llegan tarde
    const ventana = window.open("about:blank", "_blank");
    startTransition(async () => {
      const r = await abrirPaseDeLista({ matchId, teamId });
      if (!r.ok) {
        ventana?.close();
        toast.error(r.error);
        return;
      }
      const texto = recordatorio
        ? `Aguas ${sinContestar.join(", ")}: falta que contesten el pase de lista 👇 ${r.url}`
        : r.texto;
      if (ventana) ventana.location.href = wa(texto);
      else window.location.href = wa(texto);
    });
  }
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pendiente}
        onClick={() => link(false)}
        className={buttonVariants({ variant: "whatsapp", size: "cta", className: "w-full" })}
      >
        <MessageCircle aria-hidden />
        Mandar al grupo de WhatsApp
      </button>
      {sinContestar.length > 0 && (
        <button
          type="button"
          disabled={pendiente}
          onClick={() => link(true)}
          className={buttonVariants({ variant: "lima", size: "cta", className: "w-full" })}
        >
          <Send aria-hidden />
          Recordarle a los {sinContestar.length} que no contestan
        </button>
      )}
    </div>
  );
}
