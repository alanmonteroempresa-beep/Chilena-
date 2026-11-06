import type { Metadata } from "next";
import { Suspense } from "react";
import { BarraMiLiga, datosTabla, MiLigaVacia, TablaCompleta } from "@/modules/ligas/server-api";
import { Skeleton } from "@/shared/ui/skeleton";
import { contextoMiLiga } from "../contexto";

export const metadata: Metadata = { title: "Tabla" };

// Mi liga → Tabla (PRD §7.13)
export default function TablaPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-96 rounded-2xl" />}>
      <Tabla />
    </Suspense>
  );
}

async function Tabla() {
  const c = await contextoMiLiga();
  const d = c ? await datosTabla(c.contexto) : null;
  if (!d) return <MiLigaVacia />;
  return (
    <>
      <BarraMiLiga
        titulo="Tabla"
        detalle={`${d.torneo.league.siglas ?? d.torneo.league.nombre} · ${d.torneo.nombre}${d.jornadaCerrada ? ` · tras la J${d.jornadaCerrada}` : ""}`}
      />
      <TablaCompleta d={d} />
    </>
  );
}
