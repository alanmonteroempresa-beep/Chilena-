import type { Metadata } from "next";
import { Suspense } from "react";
import { Campana, type Pestana } from "@/modules/notificaciones/server-api";
import { Skeleton } from "@/shared/ui/skeleton";
import { sesionActiva } from "../sesion";

export const metadata: Metadata = { title: "Notificaciones" };

const PESTANAS: Pestana[] = ["todas", "partidos", "social", "liga"];

// La campana (pantalla 09): ?tab=partidos|social|liga
export default function NotificacionesPage({ searchParams }: PageProps<"/notificaciones">) {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-80 rounded-2xl" />}>
      <Avisos searchParams={searchParams} />
    </Suspense>
  );
}

async function Avisos({ searchParams }: Pick<PageProps<"/notificaciones">, "searchParams">) {
  const [sesion, { tab }] = await Promise.all([sesionActiva(), searchParams]);
  if (!sesion) return null;
  const pestana = PESTANAS.find((p) => p === tab) ?? "todas";
  return <Campana userId={sesion.usuario.id} pestana={pestana} ahora={new Date()} />;
}
