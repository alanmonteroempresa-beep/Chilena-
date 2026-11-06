import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { esDelegadoDe, equipoPorSlug, PaginaPaseDeLista } from "@/modules/equipos/server-api";
import { Skeleton } from "@/shared/ui/skeleton";
import { sesionActiva } from "../../../sesion";

export const metadata: Metadata = { title: "Pase de lista" };

// Pase de lista del delegado (pantallas 04 y 20 · PRD §7.6)
export default function PaseDeListaPage({ params }: PageProps<"/equipo/[slug]/pase-de-lista">) {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-80 rounded-2xl" />}>
      <PaseDeLista params={params} />
    </Suspense>
  );
}

async function PaseDeLista({ params }: Pick<PageProps<"/equipo/[slug]/pase-de-lista">, "params">) {
  const [{ slug }, sesion] = await Promise.all([params, sesionActiva()]);
  const equipo = await equipoPorSlug(slug);
  // Solo el delegado de ESE equipo (PERMISOS §3); lo demás, 404
  if (!equipo || !sesion || !(await esDelegadoDe(sesion.usuario.id, equipo.id))) notFound();
  return <PaginaPaseDeLista slugEquipo={slug} ahora={new Date()} />;
}
