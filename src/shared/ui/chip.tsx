import { cn } from "@/shared/lib/utils";

/**
 * Chip de estado (pantallas 03, 04 y 18): PENDIENTE, PAGADO, SUSPENDIDO, HABILITADO…
 * Barlow Condensed 800, 10–11 px, mayúsculas. Ámbar y rojo usan sus fondos suaves (AA en claro y oscuro).
 */
const TONOS = {
  lima: "bg-brand-lime text-ink",
  ambar: "bg-warning-soft text-warning",
  rojo: "bg-danger/12 text-danger",
  verde: "bg-success-soft text-success",
  neutro: "bg-surface-2 text-muted-foreground",
  rol: "bg-role/14 text-role",
} as const;
export type TonoChip = keyof typeof TONOS;

export function Chip({ tono = "neutro", className, children }: { tono?: TonoChip; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "etiqueta inline-flex h-5 shrink-0 items-center rounded-md px-1.5 text-[10px] font-extrabold tracking-[0.12em] whitespace-nowrap",
        TONOS[tono],
        className,
      )}
    >
      {children}
    </span>
  );
}
