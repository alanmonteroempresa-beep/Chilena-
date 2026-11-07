import { hrefCentral } from "@/modules/core";
import { CascaronApp, CascaronVisitante, isEnabled } from "@/modules/core/server-api";
import { ReportarFalla } from "@/modules/plataforma";
import { sinLeer } from "@/modules/notificaciones/server-api";
import { inicialesDe, nombreVisible } from "@/shared/lib/personas";
import { sesionActiva } from "./sesion";

export async function Cascaron({ children }: { children: React.ReactNode }) {
  const sesion = await sesionActiva();
  // Sin sesión solo llegan a lo público (/j/…): src/proxy.ts manda a /entrar desde lo privado
  if (!sesion) return <CascaronVisitante>{children}</CascaronVisitante>;
  // Sin roles no hay cascarón que pintar
  if (!sesion.activa) return <>{children}</>;
  const { usuario, opciones, activa } = sesion;
  const [avisos, conBoton] = await Promise.all([sinLeer(usuario.id), isEnabled("beta.bug_button")]);
  return (
    <CascaronApp
      avisos={avisos}
      rol={activa.rol}
      opciones={opciones}
      activoId={activa.id}
      hrefCentral={hrefCentral(activa)}
      avatar={{ iniciales: inicialesDe(nombreVisible(usuario) || usuario.username), src: null }}
      flotante={conBoton ? <ReportarFalla rol={activa.rol} /> : null}
    >
      {children}
    </CascaronApp>
  );
}
