import type { Metadata } from "next";
import { Suspense } from "react";
import { isEnabled } from "@/modules/core/server-api";
import { FormularioPublicar } from "@/modules/social/server-api";
import { Skeleton } from "@/shared/ui/skeleton";

export const metadata: Metadata = { title: "Publicar" };

// Publicar (pantalla 34 · PRD §6.2): texto; fotos y videos con el flag media.posts
export default function PublicarPage() {
  return (
    <main className="flex flex-col gap-3 px-4 pt-3.5 pb-6">
      <h1 className="titular-momento text-[42px] leading-[0.88]">Publicar</h1>
      <Suspense fallback={<Skeleton className="h-60 rounded-2xl" />}>
        <Formulario />
      </Suspense>
    </main>
  );
}

async function Formulario() {
  return <FormularioPublicar conMedia={await isEnabled("media.posts")} />;
}
