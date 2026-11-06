import { hrefCentral } from "@/modules/core";
import { CascaronApp } from "@/modules/core/server-api";
import { inicialesDe, nombreVisible } from "@/shared/lib/personas";
import { sesionActiva } from "./sesion";

export async function Cascaron({ children }: { children: React.ReactNode }) {
  const sesion = await sesionActiva();
  // Sin sesión src/proxy.ts ya mandó a /entrar; sin roles no hay cascarón que pintar
  if (!sesion?.activa) return <>{children}</>;
  const { usuario, opciones, activa } = sesion;
  return (
    <CascaronApp
      rol={activa.rol}
      opciones={opciones}
      activoId={activa.id}
      hrefCentral={hrefCentral(activa)}
      avatar={{ iniciales: inicialesDe(nombreVisible(usuario) || usuario.username), src: null }}
    >
      {children}
    </CascaronApp>
  );
}
