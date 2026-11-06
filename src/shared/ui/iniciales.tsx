import { inicialesDe } from "@/shared/lib/personas";
import { cn } from "@/shared/lib/utils";

/**
 * Avatar de la beta: iniciales en un círculo (la foto de perfil llega con Completa tu perfil).
 * `aro` pinta el aro del rol (2 px) como en las historias de la pantalla 05.
 */
export function Iniciales({
  nombre,
  tamano = 36,
  aro = false,
  className,
}: {
  nombre: string;
  tamano?: number;
  aro?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "etiqueta inline-flex shrink-0 items-center justify-center rounded-full bg-surface-2 font-extrabold text-foreground",
        aro && "shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--role-accent)]",
        className,
      )}
      style={{ width: tamano, height: tamano, fontSize: Math.round(tamano * 0.36) }}
    >
      {inicialesDe(nombre)}
    </span>
  );
}
