import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/ui/logo";

type AppHeaderProps = {
  /** Chip del rol activo (`<RoleSwitcher />`). Sin él queda el espacio libre. */
  children?: React.ReactNode;
  /** Avisos sin leer en la campana */
  avisos?: number;
  /** Avatar del usuario con el aro del rol. Sin él (visitante) no se muestra. */
  avatar?: { src?: string | null; iniciales: string; href?: string };
  /** Degradado de 14 % del color del rol detrás del header (solo en Inicio, pantalla 23) */
  degradado?: boolean;
  className?: string;
};

const botonIcono =
  "relative inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-colors hover:bg-surface-2 focus-visible:ring-3 focus-visible:ring-ring/50 outline-none";

/**
 * Header del celular — docs/PRD.md §5: logo, chip del rol activo, búsqueda, campana y avatar.
 * Medidas del export (Mi liga, 03·05·10 claro): alto 54–56 px, botones 40 px con radio 12 (aquí 44 px por área táctil).
 * El degradado del rol (14 % en la lámina 23; 10 % claro · 18 % oscuro en el export) cubre solo el header:
 * si Inicio lo quiere más largo, lo pinta la página.
 */
export function AppHeader({ children, avisos = 0, avatar, degradado = false, className }: AppHeaderProps) {
  return (
    // Fondo sólido, sin backdrop-blur: en un Android de gama baja el desenfoque al hacer scroll se traba.
    <header className={cn("sticky top-0 z-40 bg-background", className)}>
      {degradado && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-role/10 to-role/0 dark:from-role/18"
        />
      )}
      <div className="relative flex h-14 items-center gap-1.5 px-4">
        <Link
          href="/inicio"
          aria-label="Inicio"
          className="flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Logo tamano={40} />
        </Link>
        <div className="flex min-w-0 flex-1 items-center">{children}</div>
        <Link href="/buscar" aria-label="Buscar jugador, equipo o liga" className={botonIcono}>
          <Search aria-hidden className="size-5" />
        </Link>
        <Link
          href="/notificaciones"
          aria-label={avisos > 0 ? `Avisos, ${avisos} sin leer` : "Avisos"}
          className={botonIcono}
        >
          <Bell aria-hidden className="size-5" />
          {avisos > 0 && (
            <span className="etiqueta absolute -top-[5px] -right-[5px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-none font-bold text-white dark:text-ink">
              {avisos > 99 ? "99+" : avisos}
            </span>
          )}
        </Link>
        {avatar && (
          <Link
            href={avatar.href ?? "/perfil"}
            aria-label="Mi perfil"
            className="flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {/* Aro de 2 px del rol (pantalla 23) */}
            <span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-surface-2 ring-2 ring-role ring-offset-2 ring-offset-background">
              {avatar.src ? (
                // Avatar ya comprimido en el cliente (512 px, WebP)
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar.src} alt="" className="size-full object-cover" />
              ) : (
                <span className="etiqueta text-sm font-extrabold">{avatar.iniciales}</span>
              )}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
