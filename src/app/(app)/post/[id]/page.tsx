import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PaginaPost } from "@/modules/social/server-api";
import { Skeleton } from "@/shared/ui/skeleton";
import { sesionActiva } from "../../sesion";

export const metadata: Metadata = { title: "Publicación" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Una publicación con su porra (pantallas 10 y 35). Pública: la ve el visitante.
export default function PostPage({ params }: PageProps<"/post/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-4 mt-4 h-80 rounded-2xl" />}>
      <Post params={params} />
    </Suspense>
  );
}

async function Post({ params }: Pick<PageProps<"/post/[id]">, "params">) {
  const [{ id }, sesion] = await Promise.all([params, sesionActiva()]);
  if (!UUID.test(id)) notFound();
  const pagina = await PaginaPost({ id, yo: sesion?.usuario.id ?? null });
  if (!pagina) notFound();
  return pagina;
}
