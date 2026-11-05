"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ETIQUETA_ROL, type Rol } from "@/shared/lib/roles";
import { Escudo, type ColoresEquipo } from "@/shared/ui/escudo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/ui/sheet";

/** Un rol en un contexto: "Jugador · Dep. Portales" en la Liga Dominical Iztapalapa */
export type OpcionRol = {
  id: string;
  rol: Rol;
  /** Equipo o liga: "Dep. Portales" */
  titulo: string;
  /** Versión corta para el chip del header (a 390 px caben ~13 caracteres): "Dominical" */
  tituloCorto?: string;
  /** Siglas de la liga para el chip: "LDI" */
  ligaCorta?: string;
  /** Segunda línea en la lista: "Liga Dominical Iztapalapa · J15" */
  detalle?: string;
  /** Junto al rol en el chip: "#9" */
  extra?: string;
  escudo: ColoresEquipo;
  /** Chip de pendiente en la lista: "POR FIRMAR" */
  pendiente?: string;
};

type RoleSwitcherProps = {
  opciones: OpcionRol[];
  activoId: string;
  onCambiar?: (opcion: OpcionRol) => void;
  /** "Unirme a otra liga" (código o QR). Sin ruta no se muestra. */
  hrefUnirme?: string;
  className?: string;
};

/**
 * Chip del rol activo + hoja para cambiar de rol y liga — pantallas 07 y 24.
 * Al cambiar solo cambia el matiz (menú activo, etiqueta, degradado, tarjeta, aro y línea); los botones siguen en lima.
 */
export function RoleSwitcher({ opciones, activoId, onCambiar, hrefUnirme, className }: RoleSwitcherProps) {
  const [abierto, setAbierto] = useState(false);
  const activo = opciones.find((o) => o.id === activoId) ?? opciones[0];
  if (!activo) return null;

  // A 390 px el chip comparte el header con búsqueda, campana y avatar: las siglas de la liga
  // van en la línea del rol para que el nombre del equipo quepa completo.
  // Si no cabe, se corta lo menos importante (el dorsal) y no la liga.
  const etiquetaChip = [ETIQUETA_ROL[activo.rol].toUpperCase(), activo.ligaCorta, activo.extra]
    .filter(Boolean)
    .join(" · ");
  const contexto = activo.tituloCorto ?? activo.titulo;
  const puedeCambiar = opciones.length > 1 || Boolean(hrefUnirme);

  const chip = (
    <>
      <Escudo {...activo.escudo} tamano={24} conSiglas={false} />
      <span className="min-w-0 flex-1 text-left">
        <span className="etiqueta block truncate text-[10px] leading-tight font-extrabold tracking-[0.16em] text-role">
          {etiquetaChip}
        </span>
        <span className="block truncate text-[13px] leading-tight font-semibold">{contexto}</span>
      </span>
      {puedeCambiar && <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />}
    </>
  );

  const claseChip = cn(
    "flex h-11 w-full min-w-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-1.5 text-foreground outline-none",
    className,
  );

  if (!puedeCambiar) {
    return (
      <div data-role={activo.rol} className={claseChip}>
        {chip}
      </div>
    );
  }

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger
        data-role={activo.rol}
        aria-label={`Estás como ${ETIQUETA_ROL[activo.rol]} en ${activo.titulo}. Cambiar de rol o liga`}
        className={cn(
          claseChip,
          "transition-colors hover:bg-surface-2 focus-visible:ring-3 focus-visible:ring-ring/50",
        )}
      >
        {chip}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] gap-0 rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-4 pt-5 pb-3">
          <SheetTitle className="etiqueta text-xs font-extrabold tracking-[0.16em] text-muted-foreground">
            Cambiar de rol · Mis ligas
          </SheetTitle>
        </SheetHeader>
        <ul className="flex flex-col gap-2 overflow-y-auto px-4">
          {opciones.map((o) => {
            const esActivo = o.id === activo.id;
            return (
              <li key={o.id} data-role={o.rol}>
                <button
                  type="button"
                  aria-current={esActivo ? "true" : undefined}
                  onClick={() => {
                    setAbierto(false);
                    if (!esActivo) onCambiar?.(o);
                  }}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 rounded-lg border bg-surface px-3 py-2.5 text-left transition-colors outline-none hover:bg-surface-2 focus-visible:ring-3 focus-visible:ring-ring/50",
                    esActivo ? "border-role" : "border-border",
                  )}
                >
                  <Escudo {...o.escudo} tamano={30} conSiglas={false} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">
                      <span className="text-role">{ETIQUETA_ROL[o.rol]}</span> · {o.titulo}
                    </span>
                    {o.detalle && (
                      <span className="block truncate text-[13px] text-muted-foreground">{o.detalle}</span>
                    )}
                  </span>
                  {esActivo ? (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-lime text-ink">
                      <Check aria-hidden className="size-4" strokeWidth={3} />
                      <span className="sr-only">Activo</span>
                    </span>
                  ) : (
                    o.pendiente && (
                      <span className="etiqueta shrink-0 rounded-md bg-warning-soft px-1.5 py-1 text-[10px] font-extrabold tracking-[0.12em] text-warning">
                        {o.pendiente}
                      </span>
                    )
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {hrefUnirme && (
          <Link
            href={hrefUnirme}
            onClick={() => setAbierto(false)}
            className="mx-4 mt-2 flex min-h-12 items-center gap-2 rounded-lg px-1 text-[15px] font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-brand-lime text-ink">
              <Plus aria-hidden className="size-4" strokeWidth={3} />
            </span>
            <span className="flex-1">Unirme a otra liga</span>
            <span className="text-[13px] font-normal text-muted-foreground">código o QR</span>
          </Link>
        )}
      </SheetContent>
    </Sheet>
  );
}
