import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PaginaPartido, partidoCompleto } from "@/modules/partidos/server-api";
import { Skeleton } from "@/shared/ui/skeleton";

export const metadata: Metadata = { title: "Partido" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// La página del partido (pantalla 32 · `/partido/[id]`, módulo partidos). Pública: la ve el visitante.
export default function PartidoPage({ params }: PageProps<"/partido/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-3 px-4 pt-4" aria-hidden>
          <Skeleton className="h-11 rounded-lg" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-60 rounded-2xl" />
        </div>
      }
    >
      <Partido params={params} />
    </Suspense>
  );
}

async function Partido({ params }: Pick<PageProps<"/partido/[id]">, "params">) {
  const { id } = await params;
  const p = UUID.test(id) ? await partidoCompleto(id) : null;
  if (!p) notFound();
  return <PaginaPartido p={p} />;
}
