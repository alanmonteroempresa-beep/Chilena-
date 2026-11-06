import type { Metadata } from "next";
import { Suspense } from "react";
import { datosMiLiga, EncabezadoMiLiga, HubMiLiga, MiLigaVacia } from "@/modules/ligas/server-api";
import { Skeleton } from "@/shared/ui/skeleton";
import { contextoMiLiga } from "./contexto";

export const metadata: Metadata = { title: "Mi liga" };

// Hub de Mi liga (PRD §5 · pantalla Mi liga, módulo ligas)
export default function MiLigaPage() {
  return (
    <Suspense fallback={<MiLigaCargando />}>
      <MiLiga />
    </Suspense>
  );
}

async function MiLiga() {
  const c = await contextoMiLiga();
  const d = c ? await datosMiLiga(c.contexto) : null;
  if (!c || !d) return <MiLigaVacia />;
  return (
    <>
      <EncabezadoMiLiga torneo={d.torneo} jornada={d.jornada} miEquipo={d.miEquipo} />
      <HubMiLiga d={d} yo={c.yo} esJugador={c.rol === "jugador"} />
    </>
  );
}

function MiLigaCargando() {
  return (
    <div className="flex flex-col gap-3 px-4 pt-3.5" aria-hidden>
      <Skeleton className="h-11 w-40 rounded-lg" />
      <Skeleton className="h-11 rounded-xl" />
      <Skeleton className="h-48 rounded-[18px]" />
      <Skeleton className="h-36 rounded-2xl" />
    </div>
  );
}
