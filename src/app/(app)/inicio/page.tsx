import type { Metadata } from "next";
import { Suspense } from "react";
import { InicioProvisional, necesitaCompletarPerfil } from "@/modules/core/server-api";
import { Skeleton } from "@/shared/ui/skeleton";
import { sesionActiva } from "../sesion";

export const metadata: Metadata = { title: "Inicio" };

// Inicio según el rol activo (03 jugador · 04 delegado · 05 aficionado · 02 árbitro · 18 liga)
export default function InicioPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-48 rounded-2xl" />}>
      <Inicio />
    </Suspense>
  );
}

async function Inicio() {
  const sesion = await sesionActiva();
  if (!sesion?.activa) return null;
  const { usuario, activa } = sesion;
  const sinContexto = activa.id.endsWith(":sin-contexto");
  return (
    <InicioProvisional
      rol={activa.rol}
      contexto={sinContexto ? undefined : activa.titulo}
      sinContexto={sinContexto ? activa.detalle : undefined}
      completarPerfil={necesitaCompletarPerfil(usuario)}
    />
  );
}
