import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";

/**
 * Cascarón sin sesión (pantalla 06 · PRD §4.2): el visitante ve todo lo público. Arriba la franja
 * "Estás viendo Chilena como visitante" y el botón para entrar; sin barra inferior.
 */
export function CascaronVisitante({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <p className="flex items-center justify-center gap-2 bg-brand-blue px-4 py-2 text-xs font-semibold text-white">
        Estás viendo Chilena como visitante
        <Link href="/entrar" className="etiqueta inline-flex items-center gap-1 tracking-[0.12em] text-brand-lime">
          Crear cuenta <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </p>
      <header className="flex h-14 items-center gap-2 px-4">
        <Link href="/" aria-label="Chilena">
          <Logo tamano={40} />
        </Link>
        <span className="flex-1" />
        <Link href="/entrar" className={buttonVariants({ variant: "lima", size: "cta", className: "h-10 px-4" })}>
          Entrar
        </Link>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
