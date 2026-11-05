import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Vitrina } from "./vitrina";

export const metadata: Metadata = { title: "Componentes de marca", robots: { index: false } };

// Vitrina de componentes de marca (Fase 0). No se publica en producción.
export default function ComponentesPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return <Vitrina />;
}
