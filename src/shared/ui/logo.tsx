import Image from "next/image";
import { cn } from "@/shared/lib/utils";

/**
 * Logo de Chilena: siempre como imagen (docs/DISENO.md §1).
 * Oscuro → disco azul (`logo-azul.png`) · Claro → disco blanco (`logo-claro.png`), como en el export de Claude Design.
 */
export function Logo({ tamano = 40, className }: { tamano?: number; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0", className)} style={{ width: tamano, height: tamano }}>
      <Image
        src="/brand/logo-claro.png"
        alt="chilena"
        width={tamano}
        height={tamano}
        className="dark:hidden"
      />
      <Image
        src="/brand/logo-azul.png"
        alt="chilena"
        width={tamano}
        height={tamano}
        className="hidden dark:block"
      />
    </span>
  );
}
