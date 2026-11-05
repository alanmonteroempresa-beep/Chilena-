import { BadgeCheck, Megaphone } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Escudo, type ColoresEquipo } from "@/shared/ui/escudo";

/**
 * Estado del marcador — docs/DISENO.md §4 · pantalla 32.
 * Regla 1: lo que se captura desde la banda es NO OFICIAL; solo la cédula validada es OFICIAL.
 */
export type EstadoMarcador =
  | { tipo: "en-vivo"; minuto?: number }
  | { tipo: "final" }
  | { tipo: "no-oficial" }
  | { tipo: "oficial"; arbitro?: string };

export function textoEstadoMarcador(estado: EstadoMarcador): string {
  switch (estado.tipo) {
    case "en-vivo":
      return estado.minuto != null ? `EN VIVO · ${estado.minuto}'` : "EN VIVO";
    case "final":
      return "FINAL";
    case "no-oficial":
      return "NO OFICIAL · DESDE LA BANDA";
    case "oficial":
      return estado.arbitro ? `OFICIAL · CÉDULA DE ${estado.arbitro.toUpperCase()}` : "OFICIAL · CÉDULA";
  }
}

const estiloEstado: Record<EstadoMarcador["tipo"], string> = {
  // El rojo de modo claro (#C8102E) pide texto blanco; el de oscuro (#FF4D4F), tinta (pantalla 32)
  "en-vivo": "bg-danger text-white dark:text-ink",
  final: "bg-surface-2 text-muted-foreground",
  "no-oficial": "bg-warning/14 text-warning",
  oficial: "bg-success/14 text-success",
};

/** Chip de estado: EN VIVO · 88' (rojo con punto) · FINAL · NO OFICIAL · OFICIAL */
export function ChipEstado({ estado, className }: { estado: EstadoMarcador; className?: string }) {
  return (
    <span
      className={cn(
        "etiqueta inline-flex h-6 shrink-0 items-center gap-[5px] rounded-[7px] px-[9px] text-[11px] font-extrabold tracking-[0.12em] whitespace-nowrap",
        estiloEstado[estado.tipo],
        className,
      )}
    >
      {estado.tipo === "en-vivo" && (
        <span aria-hidden className="size-1.5 rounded-full bg-white motion-safe:animate-pulse dark:bg-ink" />
      )}
      {estado.tipo === "no-oficial" && <Megaphone aria-hidden className="size-3.5" />}
      {estado.tipo === "oficial" && <BadgeCheck aria-hidden className="size-3.5" />}
      {textoEstadoMarcador(estado)}
    </span>
  );
}

type EquipoMarcador = ColoresEquipo & { siglas: string; nombre: string };

type ChipMarcadorProps = {
  local: EquipoMarcador;
  visitante: EquipoMarcador;
  golesLocal: number;
  golesVisitante: number;
  estado?: EstadoMarcador;
  /** Muestra el nombre corto del equipo junto al escudo (PORTALES 3–2 CONDESA) */
  conNombres?: boolean;
  className?: string;
};

/** Chip de marcador: escudos + "3–2" + estado (docs/DISENO.md §4) */
export function ChipMarcador({
  local,
  visitante,
  golesLocal,
  golesVisitante,
  estado,
  conNombres = false,
  className,
}: ChipMarcadorProps) {
  const marcador = `${golesLocal}–${golesVisitante}`;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      <span
        className="inline-flex items-center gap-2"
        aria-label={`${local.nombre} ${golesLocal}, ${visitante.nombre} ${golesVisitante}`}
        role="img"
      >
        <Escudo {...local} tamano={24} />
        {conNombres && (
          <span className="etiqueta text-xs font-extrabold tracking-[0.1em]">{local.nombre}</span>
        )}
        <span className="etiqueta rounded-md bg-foreground px-1.5 py-0.5 text-base leading-none font-extrabold text-background">
          {marcador}
        </span>
        {conNombres && (
          <span className="etiqueta text-xs font-extrabold tracking-[0.1em]">{visitante.nombre}</span>
        )}
        <Escudo {...visitante} tamano={24} />
      </span>
      {estado && <ChipEstado estado={estado} />}
    </span>
  );
}
