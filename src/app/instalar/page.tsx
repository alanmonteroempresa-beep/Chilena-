import type { Metadata } from "next";
import { Instalar } from "@/modules/plataforma";

export const metadata: Metadata = { title: "Instala la app" };

// Pantalla 43 · guía corta para iPhone y Android, sin tienda de apps
export default function InstalarPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.25rem)]">
      <Instalar />
    </main>
  );
}
