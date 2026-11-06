"use client";

import { toast } from "sonner";

/**
 * Botón de una acción que todavía no existe en el recorrido de solo lectura (CONFIRMO QUE VOY, PAGAR,
 * RECORDATORIO…). Se ve como en el diseño y al tocarlo avisa que llega pronto: no escribe nada.
 */
export function AccionPronto({
  aviso = "Llega pronto",
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"button">, "onClick" | "type"> & { aviso?: string }) {
  return (
    <button
      type="button"
      data-pronto
      className={className}
      onClick={() => toast(aviso, { description: "Por ahora el recorrido es de solo lectura." })}
      {...props}
    >
      {children}
    </button>
  );
}
