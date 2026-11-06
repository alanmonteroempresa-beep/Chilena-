import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { aPostDelFeed } from "../server/feed";
import { postPorId, reaccionesDe } from "../server/queries";
import { TarjetaPost } from "./feed/tarjetas";
import { Porra } from "./porra/porra";

/** Una publicación con su porra (pantallas 10 y 35): se abre desde 💬; la ve cualquiera */
export async function PaginaPost({ id, yo }: { id: string; yo: string | null }) {
  const fila = await postPorId(id);
  if (!fila) return null;
  const { conteos, mias } = await reaccionesDe([id], yo ?? undefined);
  const post = { ...aPostDelFeed(fila), reacciones: conteos.get(id) ?? {}, mia: mias.get(id) ?? null };
  return (
    <main className="flex flex-col gap-3 px-4 pt-3 pb-6">
      <Link href="/inicio" className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1.5 px-2 text-sm font-semibold text-muted-foreground">
        <ArrowLeft aria-hidden className="size-4" />
        Inicio
      </Link>
      <TarjetaPost p={post} conSesion={Boolean(yo)} />
      <Porra postId={id} yo={yo} />
    </main>
  );
}
