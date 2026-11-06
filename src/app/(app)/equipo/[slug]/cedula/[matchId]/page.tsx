import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { esDelegadoDe, equipoPorSlug } from "@/modules/equipos/server-api";
import { RevisarCedula, vistaDeLaCedula } from "@/modules/partidos/server-api";
import { Skeleton } from "@/shared/ui/skeleton";
import { sesionActiva } from "../../../../sesion";

export const metadata: Metadata = { title: "Cédula", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// El delegado revisa la cédula antes de firmar: señala o firma (pantalla 19 · PRD §7.7)
export default function CedulaDelegadoPage({ params }: PageProps<"/equipo/[slug]/cedula/[matchId]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-96 rounded-2xl" />}>
      <Cedula params={params} />
    </Suspense>
  );
}

async function Cedula({ params }: Pick<PageProps<"/equipo/[slug]/cedula/[matchId]">, "params">) {
  const [{ slug, matchId }, sesion] = await Promise.all([params, sesionActiva()]);
  if (!UUID.test(matchId)) notFound();
  const equipo = await equipoPorSlug(slug);
  if (!equipo || !sesion || !(await esDelegadoDe(sesion.usuario.id, equipo.id))) notFound();
  const v = await vistaDeLaCedula(matchId);
  if (!v || (v.local.teamId !== equipo.id && v.visita.teamId !== equipo.id)) notFound();
  if (!v.cedula || v.cedula.estado === "BORRADOR")
    return <p className="px-4 pt-6 text-sm text-muted-foreground">El árbitro todavía no manda la cédula de este partido.</p>;
  return <RevisarCedula v={v} teamId={equipo.id} />;
}
