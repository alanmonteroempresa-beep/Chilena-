import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { esDelegadoDe, equipoPorSlug, PaginaAlineacion } from "@/modules/equipos/server-api";
import { Skeleton } from "@/shared/ui/skeleton";
import { sesionActiva } from "../../../sesion";

export const metadata: Metadata = { title: "Alineación" };

// Alineación del próximo partido (pantalla 53 · PRD §7.6)
export default function AlineacionPage({ params }: PageProps<"/equipo/[slug]/alineacion">) {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-96 rounded-2xl" />}>
      <Alineacion params={params} />
    </Suspense>
  );
}

async function Alineacion({ params }: Pick<PageProps<"/equipo/[slug]/alineacion">, "params">) {
  const [{ slug }, sesion] = await Promise.all([params, sesionActiva()]);
  const equipo = await equipoPorSlug(slug);
  if (!equipo || !sesion || !(await esDelegadoDe(sesion.usuario.id, equipo.id))) notFound();
  return <PaginaAlineacion slugEquipo={slug} ahora={new Date()} />;
}
