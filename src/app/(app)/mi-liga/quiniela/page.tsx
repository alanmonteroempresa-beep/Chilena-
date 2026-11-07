import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BarraMiLiga, MiLigaVacia, torneoDeMiLiga } from "@/modules/ligas/server-api";
import { PaginaQuiniela } from "@/modules/votaciones/server-api";
import { Skeleton } from "@/shared/ui/skeleton";
import { contextoMiLiga } from "../contexto";

export const metadata: Metadata = { title: "Quiniela" };

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Mi liga → Quiniela (pantalla 13, módulo votaciones): ?partido=<id> elige el partido; ?ranking=liga|porra
export default function QuinielaPage({ searchParams }: PageProps<"/mi-liga/quiniela">) {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-96 rounded-2xl" />}>
      <Quiniela searchParams={searchParams} />
    </Suspense>
  );
}

async function Quiniela({ searchParams }: Pick<PageProps<"/mi-liga/quiniela">, "searchParams">) {
  const [q, c] = await Promise.all([searchParams, contextoMiLiga()]);
  await connection();
  const base = c ? await torneoDeMiLiga(c.contexto) : null;
  if (!c || !base) return <MiLigaVacia />;
  const partido = uno(q.partido);
  return (
    <>
      <BarraMiLiga titulo="Quiniela" detalle={`${base.torneo.league.siglas ?? base.torneo.league.nombre} · ${base.torneo.nombre}`} />
      <PaginaQuiniela
        tournamentId={base.torneo.id}
        yo={c.yo}
        miEquipo={base.miEquipo ? { id: base.miEquipo.id, nombre: base.miEquipo.nombre } : null}
        partidoId={partido && /^[0-9a-f-]{36}$/i.test(partido) ? partido : undefined}
        ranking={uno(q.ranking) === "liga" ? "liga" : "porra"}
        ahora={new Date()}
      />
    </>
  );
}
