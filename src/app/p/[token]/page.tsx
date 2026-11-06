import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PaginaLink } from "@/modules/equipos/server-api";
import { Skeleton } from "@/shared/ui/skeleton";

export const metadata: Metadata = { title: "¿Vas el domingo?", robots: { index: false } };

// El link del pase de lista que llega al grupo de WhatsApp (pantalla 20): sin cuenta y sin descargar nada
export default function LinkPage({ params }: PageProps<"/p/[token]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-10 h-96 w-full max-w-md rounded-2xl" />}>
      <Link params={params} />
    </Suspense>
  );
}

async function Link({ params }: Pick<PageProps<"/p/[token]">, "params">) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(token)) notFound();
  // La hora de "ahora" es de la petición, no del prerender
  await connection();
  const pagina = await PaginaLink({ token, ahora: new Date() });
  if (!pagina) notFound();
  return pagina;
}
