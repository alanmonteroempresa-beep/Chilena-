import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BarraMiLiga, MiLigaVacia, torneoDeMiLiga } from "@/modules/ligas/server-api";
import { PaginaVotaciones } from "@/modules/votaciones/server-api";
import { Skeleton } from "@/shared/ui/skeleton";
import { contextoMiLiga } from "../contexto";

export const metadata: Metadata = { title: "Votaciones" };

// Mi liga → Votaciones (pantalla 12, módulo votaciones): el MVP de cada partido validado
export default function VotacionesPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-96 rounded-2xl" />}>
      <Votaciones />
    </Suspense>
  );
}

async function Votaciones() {
  await connection();
  const c = await contextoMiLiga();
  const base = c ? await torneoDeMiLiga(c.contexto) : null;
  if (!c || !base) return <MiLigaVacia />;
  return (
    <>
      <BarraMiLiga titulo="Votaciones" detalle={`${base.torneo.league.siglas ?? base.torneo.league.nombre} · ${base.torneo.nombre}`} />
      <PaginaVotaciones tournamentId={base.torneo.id} yo={c.yo} miEquipoId={base.miEquipo?.id ?? null} ahora={new Date()} />
    </>
  );
}
