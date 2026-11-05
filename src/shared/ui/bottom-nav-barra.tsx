"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  ListChecks,
  Plus,
  Radio,
  UserRound,
  Whistle,
  CalendarPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { accionCentral, type ClaveAccionCentral, type RolOVisitante } from "@/shared/lib/roles";
import { IconoEstadio } from "@/shared/ui/iconos";

export type BarraInferiorProps = {
  rol: RolOVisitante;
  /** Ruta del botón central cuando depende del contexto (pase de lista del equipo, programar jornada de la liga) */
  hrefCentral?: string;
  className?: string;
};

const ICONO_CENTRAL: Record<ClaveAccionCentral, LucideIcon> = {
  publicar: Plus,
  "pase-de-lista": ListChecks,
  capturar: Whistle,
  "programar-jornada": CalendarPlus,
};

// `relleno`: el activo se rellena como el FILL de Material del diseño (solo figuras cerradas;
// los arcos de "En vivo" se verían rotos con relleno)
const ITEMS = [
  { href: "/inicio", etiqueta: "Inicio", Icono: House, relleno: true },
  { href: "/en-vivo", etiqueta: "En vivo", Icono: Radio, relleno: false },
  null, // botón central
  { href: "/mi-liga", etiqueta: "Mi liga", Icono: IconoEstadio, relleno: true },
  { href: "/perfil", etiqueta: "Perfil", Icono: UserRound, relleno: true },
] as const;

function estaActivo(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Barra inferior del celular — pantalla 07b, docs/PRD.md §5.
 * Medidas del export: 5 columnas, íconos de 24 px, texto de 11 px; el central es un círculo lima de 52 px
 * que sube 22 px con un aro de 5 px del color de la barra. El activo se pinta con el color del rol.
 */
export function BarraInferior({
  rol,
  hrefCentral,
  className,
  pathname,
}: BarraInferiorProps & { pathname: string | null }) {
  const accion = accionCentral(rol);
  const IconoCentral = ICONO_CENTRAL[accion.clave];
  const destinoCentral = hrefCentral ?? accion.href;

  return (
    <nav
      aria-label="Principal"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-(--barra) pb-[env(safe-area-inset-bottom)] [--barra:var(--surface)] dark:[--barra:var(--background)]",
        className,
      )}
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5 px-1 pt-2">
        {ITEMS.map((item) => {
          if (!item) {
            const contenido = (
              <>
                <span className="flex size-[52px] items-center justify-center rounded-full bg-brand-lime text-ink shadow-[0_0_0_5px_var(--barra),0_4px_10px_5px_rgba(7,9,12,0.06)] dark:shadow-[0_0_0_5px_var(--barra)]">
                  <IconoCentral aria-hidden className="size-7" strokeWidth={2.5} />
                </span>
                <span className="whitespace-nowrap">{accion.etiqueta}</span>
              </>
            );
            const clase =
              "-mt-[22px] flex flex-col items-center gap-[3px] text-[11px] font-bold text-foreground outline-none focus-visible:[&>span:first-child]:ring-3 focus-visible:[&>span:first-child]:ring-ring/60";
            return (
              <li key="central" className="flex justify-center">
                {destinoCentral ? (
                  <Link href={destinoCentral} aria-label={accion.nombre} className={clase}>
                    {contenido}
                  </Link>
                ) : (
                  <span aria-disabled className={cn(clase, "opacity-60")} title={accion.nombre}>
                    {contenido}
                  </span>
                )}
              </li>
            );
          }
          const activo = estaActivo(pathname, item.href);
          const { Icono, relleno } = item;
          return (
            <li key={item.href} className="flex justify-center">
              <Link
                href={item.href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex min-h-11 min-w-11 flex-col items-center gap-[3px] rounded-lg text-[11px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  activo ? "font-bold text-role" : "font-semibold text-muted-foreground",
                )}
              >
                <Icono
                  aria-hidden
                  className={cn("size-6", activo && relleno && "fill-current/25")}
                  strokeWidth={activo ? 2.5 : 2}
                />
                {item.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Lee la ruta para marcar el activo. Va dentro de <Suspense> (cacheComponents + rutas dinámicas). */
export function BarraInferiorConRuta(props: BarraInferiorProps) {
  const pathname = usePathname();
  return <BarraInferior {...props} pathname={pathname} />;
}
