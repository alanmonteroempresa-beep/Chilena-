import { cn } from "@/shared/lib/utils";

const HEXAGONO = "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

/** Hexágono de insignia (pantalla 28): lima si la tiene, gris si le falta */
export function HexagonoInsignia({
  icon,
  ganada,
  tamano = 46,
  className,
}: {
  icon: string | null;
  ganada: boolean;
  tamano?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        ganada ? "bg-brand-lime" : "bg-surface-2 opacity-70 grayscale",
        className,
      )}
      style={{ width: tamano, height: tamano * 1.1, clipPath: HEXAGONO, fontSize: tamano * 0.46 }}
    >
      {icon}
    </span>
  );
}

/** Rareza como en el diseño: "41% la tiene" · "Sólo el 8%" */
export const textoRareza = (pct: number) => (pct < 10 ? `Sólo el ${pct}%` : `${pct}% la tiene`);
