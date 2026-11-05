import type { Metadata } from "next";
import { PantallaEntrar } from "@/modules/core/server-api";

// F-001 Entrar · pantalla 01
export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  return <PantallaEntrar parametros={searchParams} />;
}
