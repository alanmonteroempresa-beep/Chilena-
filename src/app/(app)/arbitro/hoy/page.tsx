import type { Metadata } from "next";
import { Suspense } from "react";
import { InicioVacio } from "@/modules/core/server-api";
import { pagosAlArbitro } from "@/modules/ligas/server-api";
import { InicioArbitro } from "@/modules/partidos/server-api";
import { Skeleton } from "@/shared/ui/skeleton";
import { sesionActiva } from "../../sesion";

export const metadata: Metadata = { title: "Tus partidos de hoy" };

// Mis partidos de hoy (pantalla 02): el botón central "Capturar" del árbitro. Cada partido abre su cédula.
export default function Pagina() {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-96 rounded-2xl" />}>
      <PartidosDeHoy />
    </Suspense>
  );
}

async function PartidosDeHoy() {
  const sesion = await sesionActiva();
  if (!sesion) return null;
  const { usuario, activa } = sesion;
  if (!usuario.roles.some((r) => r.role === "ARBITRO")) return <InicioVacio rol="arbitro" />;
  const pagos = await pagosAlArbitro(usuario.id);
  return (
    <InicioArbitro
      userId={usuario.id}
      ahora={new Date()}
      ligaCorta={activa?.rol === "arbitro" ? activa.ligaCorta : undefined}
      porCobrarCents={pagos.reduce((s, p) => s + p.amountCents, 0)}
    />
  );
}
