"use client";

import { useTransition } from "react";
import { RoleSwitcher, type OpcionRol } from "@/shared/ui/role-switcher";
import { cambiarRol } from "../../server/actions";

/** Chip del rol activo + hoja para cambiar (pantallas 07 y 24). Cambiar de rol guarda el rol y regresa al inicio. */
export function SelectorRol({ opciones, activoId }: { opciones: OpcionRol[]; activoId: string }) {
  const [cambiando, startTransition] = useTransition();
  return (
    <RoleSwitcher
      opciones={opciones}
      activoId={activoId}
      className={cambiando ? "opacity-60" : undefined}
      onCambiar={(o) => {
        if (o.id === activoId) return;
        startTransition(() => cambiarRol(o.rol));
      }}
    />
  );
}
