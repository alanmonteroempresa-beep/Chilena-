import type { Metadata } from "next";
import { Suspense } from "react";
import { BarraMiLiga, datosRolDeJuegos, MiLigaVacia, RolDeJuegos } from "@/modules/ligas/server-api";
import { Skeleton } from "@/shared/ui/skeleton";
import { contextoMiLiga } from "../contexto";

export const metadata: Metadata = { title: "Rol de juegos" };

// Mi liga → Rol de juegos (pantalla 45 en lectura): ?j=16 elige la jornada
export default function RolPage({ searchParams }: PageProps<"/mi-liga/rol">) {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-80 rounded-2xl" />}>
      <Rol searchParams={searchParams} />
    </Suspense>
  );
}

async function Rol({ searchParams }: Pick<PageProps<"/mi-liga/rol">, "searchParams">) {
  const [{ j }, c] = await Promise.all([searchParams, contextoMiLiga()]);
  const pedida = Number(Array.isArray(j) ? j[0] : j);
  const d = c ? await datosRolDeJuegos(c.contexto, Number.isInteger(pedida) ? pedida : undefined) : null;
  if (!d) return <MiLigaVacia />;
  return (
    <>
      <BarraMiLiga titulo="Rol de juegos" detalle={`${d.torneo.league.siglas ?? d.torneo.league.nombre} · ${d.torneo.nombre}`} />
      <RolDeJuegos d={d} />
    </>
  );
}
