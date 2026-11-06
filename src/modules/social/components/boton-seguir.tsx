"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import { seguir } from "../server/actions";

/** Seguir a un jugador o a un equipo (optimista). `texto` = botón de texto con el color del rol. */
export function BotonSeguir({
  persona,
  equipo,
  siguiendo: inicial,
  conSesion = true,
  variante = "lima",
  className,
}: {
  persona?: string;
  equipo?: string;
  siguiendo: boolean;
  conSesion?: boolean;
  variante?: "lima" | "texto";
  className?: string;
}) {
  const [siguiendo, setSiguiendo] = useState(inicial);
  const [pendiente, startTransition] = useTransition();
  function tocar() {
    if (!conSesion) {
      toast("Entra para seguir", { description: "Con tu cuenta ves todo lo suyo en Siguiendo." });
      return;
    }
    const quiere = !siguiendo;
    setSiguiendo(quiere);
    startTransition(async () => {
      const r = await seguir({ persona, equipo, seguir: quiere });
      if (!r.ok) {
        setSiguiendo(!quiere);
        toast.error(r.error);
      }
    });
  }
  return (
    <button
      type="button"
      aria-pressed={siguiendo}
      disabled={pendiente}
      onClick={tocar}
      className={cn(
        variante === "lima"
          ? buttonVariants({ variant: siguiendo ? "quieto" : "lima", size: "cta", className: cn(siguiendo && "border border-border") })
          : "etiqueta inline-flex min-h-11 items-center px-2 text-xs font-extrabold tracking-[0.12em] text-role",
        className,
      )}
    >
      {siguiendo ? "Siguiendo" : "Seguir"}
    </button>
  );
}
