import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { AccionPronto } from "@/shared/ui/accion-pronto";
import { coloresDe, Escudo } from "@/shared/ui/escudo";

type Torneo = { nombre: string; numJornadas: number | null; league: { nombre: string; siglas: string | null } };
type Equipo = { nombre: string; siglas: string | null; colorPrimario: string | null; colorSecundario: string | null; posicion: number | null };

/**
 * Encabezado de Mi liga (hub · celular): "MI LIGA", la liga y el torneo (cambiar de liga llega con su fase)
 * y el equipo de quien entra con su lugar en la tabla.
 */
export function EncabezadoMiLiga({ torneo, jornada, miEquipo }: { torneo: Torneo; jornada: number | null; miEquipo: Equipo | null }) {
  const pildora =
    "inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-[13px] font-semibold";
  return (
    <header className="flex flex-col gap-3 px-4 pt-3.5">
      <h1 className="titular-momento text-[46px] leading-[0.85]">Mi liga</h1>
      <div className="flex gap-2">
        <AccionPronto aviso="Cambiar de liga llega pronto" className={`${pildora} min-w-0 flex-1`}>
          <span className="etiqueta rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] tracking-[0.1em]">
            {torneo.league.siglas ?? "LIGA"}
          </span>
          <span className="truncate">{torneo.league.nombre}</span>
          <ChevronDown aria-hidden className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </AccionPronto>
        <AccionPronto aviso="Cambiar de torneo llega pronto" className={`${pildora} shrink-0`}>
          {torneo.nombre.replace(/(\d{2})(\d{2})$/, "$2")}
          <ChevronDown aria-hidden className="size-4 text-muted-foreground" />
        </AccionPronto>
      </div>
      <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {jornada != null && (
          <span>
            {torneo.nombre} · J{jornada}
            {torneo.numJornadas ? ` de ${torneo.numJornadas}` : ""}
          </span>
        )}
        {miEquipo && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5">
            <Escudo {...coloresDe(miEquipo)} tamano={12} conSiglas={false} />
            Tu equipo: {miEquipo.nombre}
            {miEquipo.posicion ? ` · ${miEquipo.posicion}º` : ""}
          </span>
        )}
      </p>
    </header>
  );
}

/** Barra de las vistas de Mi liga (Tabla, Rol de juegos, Goleo): volver al hub y el título */
export function BarraMiLiga({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return (
    <header className="flex flex-col gap-1 px-4 pt-3">
      <Link href="/mi-liga" className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1.5 px-2 text-sm font-semibold text-muted-foreground">
        <ArrowLeft aria-hidden className="size-4" />
        Mi liga
      </Link>
      <h1 className="titular-momento text-[40px] leading-[0.88]">{titulo}</h1>
      {detalle && <p className="text-xs text-muted-foreground">{detalle}</p>}
    </header>
  );
}
