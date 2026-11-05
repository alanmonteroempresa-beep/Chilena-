import { cn } from "@/shared/lib/utils";
import { textoSobre } from "@/shared/lib/color";

export type ColoresEquipo = {
  siglas?: string;
  /** Color principal del equipo (relleno) */
  color: string;
  /** Franja superior (segundo color del uniforme) */
  colorFranja?: string;
};

type EscudoProps = ColoresEquipo & {
  /** Ancho en px */
  tamano?: number;
  /** "escudo" = forma de escudo (partido, carta) · "cuadro" = cuadro (selector de rol, chips) */
  forma?: "escudo" | "cuadro";
  /** Muestra las siglas dentro (si caben) */
  conSiglas?: boolean;
  /** Contorno de 1 px en modo claro para que la franja blanca no se pierda sobre blanco (pantalla 05 claro) */
  contorno?: boolean;
  className?: string;
};

/**
 * Escudo de equipo: los escudos son de cada equipo, nunca del rol (pantalla 23).
 * Medidas del export: partido 40×43 con franja de 9 px · carta 30×32 con franja de 7 px · selector 30×30 con 5 px.
 */
export function Escudo({
  siglas,
  color,
  colorFranja = "#FFFFFF",
  tamano = 30,
  forma = "cuadro",
  conSiglas = true,
  contorno = true,
  className,
}: EscudoProps) {
  const alto = forma === "escudo" ? Math.round(tamano * 1.075) : tamano;
  const radio =
    forma === "escudo"
      ? `${Math.round(tamano * 0.18)}px ${Math.round(tamano * 0.18)}px ${Math.round(tamano * 0.45)}px ${Math.round(tamano * 0.45)}px`
      : `${Math.round(tamano * 0.2)}px`;
  const franja = Math.max(3, Math.round(tamano * (forma === "escudo" ? 0.22 : 0.17)));
  const mostrarSiglas = conSiglas && siglas && tamano >= 22;

  return (
    <span
      aria-hidden
      className={cn(
        "etiqueta inline-flex shrink-0 items-center justify-center box-border",
        contorno && "shadow-[0_0_0_1px_var(--border)] dark:shadow-none",
        className,
      )}
      style={{
        width: tamano,
        height: alto,
        borderRadius: radio,
        background: color,
        borderTop: `${franja}px solid ${colorFranja}`,
        color: textoSobre(color),
        fontSize: Math.round(tamano * 0.34),
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: 0,
      }}
    >
      {mostrarSiglas ? siglas : null}
    </span>
  );
}
