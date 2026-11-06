import type { Rol } from "@/shared/lib/roles";
import { AppHeader } from "@/shared/ui/app-header";
import { BottomNav } from "@/shared/ui/bottom-nav";
import type { OpcionRol } from "@/shared/ui/role-switcher";
import { RolEnBody } from "./rol-en-body";
import { SelectorRol } from "./selector-rol";

type Props = {
  rol: Rol;
  opciones: OpcionRol[];
  activoId: string;
  hrefCentral?: string;
  avatar: { iniciales: string; src?: string | null };
  avisos?: number;
  children: React.ReactNode;
};

/**
 * Cascarón de la app con sesión (PRD §5 · pantallas 07b, 23, 24): header con el selector de rol,
 * contenido y barra inferior (Inicio · En vivo · central por rol · Mi liga · Perfil). El acento sale de data-role.
 */
export function CascaronApp({ rol, opciones, activoId, hrefCentral, avatar, avisos = 0, children }: Props) {
  return (
    <div data-role={rol} className="flex min-h-dvh flex-col bg-background">
      <RolEnBody rol={rol} />
      <AppHeader avisos={avisos} avatar={{ ...avatar, href: "/perfil" }} degradado>
        <SelectorRol opciones={opciones} activoId={activoId} />
      </AppHeader>
      <div className="flex flex-1 flex-col pb-[calc(84px+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav rol={rol} hrefCentral={hrefCentral} />
    </div>
  );
}
