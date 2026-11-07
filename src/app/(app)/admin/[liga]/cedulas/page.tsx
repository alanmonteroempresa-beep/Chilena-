import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { rolEnLiga, torneoVigenteDeLaLiga } from "@/modules/ligas/server-api";
import { RevisarCedulas } from "@/modules/partidos/server-api";
import { Skeleton } from "@/shared/ui/skeleton";
import { sesionActiva } from "../../../sesion";

export const metadata: Metadata = { title: "Revisar cédulas", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Revisar y validar cédulas (pantalla 46 · PRD §7.7): solo quien administra ESA liga
export default function CedulasPage({ params, searchParams }: PageProps<"/admin/[liga]/cedulas">) {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-96 rounded-2xl" />}>
      <Cedulas params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Cedulas({ params, searchParams }: Pick<PageProps<"/admin/[liga]/cedulas">, "params" | "searchParams">) {
  const [{ liga }, { partido }, sesion] = await Promise.all([params, searchParams, sesionActiva()]);
  const torneo = await torneoVigenteDeLaLiga(liga);
  if (!sesion || !torneo) notFound();
  const rol = await rolEnLiga(sesion.usuario.id, torneo.league.id);
  if (!rol) notFound();
  const seleccion = typeof partido === "string" && UUID.test(partido) ? partido : undefined;
  return (
    <RevisarCedulas
      slugLiga={liga}
      torneo={{ id: torneo.id, nombre: torneo.nombre }}
      seleccion={seleccion}
      puedeValidar={rol === "DUENO" || rol === "ADMINISTRADOR"}
      ahora={new Date()}
    />
  );
}
