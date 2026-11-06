import type { Metadata } from "next";
import { Suspense } from "react";
import { BarraMiLiga, datosGoleo, GoleoCompleto, MiLigaVacia } from "@/modules/ligas/server-api";
import { Skeleton } from "@/shared/ui/skeleton";
import { contextoMiLiga } from "../contexto";

export const metadata: Metadata = { title: "Goleo" };

// Mi liga → Goleo
export default function GoleoPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-96 rounded-2xl" />}>
      <Goleo />
    </Suspense>
  );
}

async function Goleo() {
  const c = await contextoMiLiga();
  const d = c ? await datosGoleo(c.contexto) : null;
  if (!c || !d) return <MiLigaVacia />;
  return (
    <>
      <BarraMiLiga titulo="Goleo" detalle={`${d.torneo.league.siglas ?? d.torneo.league.nombre} · ${d.torneo.nombre}`} />
      <GoleoCompleto d={d} yo={c.yo} />
    </>
  );
}
