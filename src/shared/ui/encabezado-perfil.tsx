import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { AccionPronto } from "@/shared/ui/accion-pronto";
import { Iniciales } from "@/shared/ui/iniciales";

export type PestanaPerfil = "carta" | "insignias" | "stats";

/**
 * Encabezado del perfil público (pantallas 06 y 28): avatar, nombre de momento, quién es y cuántas
 * insignias lleva; abajo las pestañas Carta · Insignias · Golazos · Stats.
 */
export function EncabezadoPerfil({
  username,
  nombre,
  detalle,
  insignias,
  activa,
}: {
  username: string;
  nombre: string;
  /** "Delantero · #9 · Dep. Portales" */
  detalle: string;
  insignias?: { ganadas: number; total: number };
  activa: PestanaPerfil;
}) {
  const base = `/j/${username}`;
  const pestanas: { clave: PestanaPerfil | "golazos"; texto: string; href?: string }[] = [
    { clave: "carta", texto: "Carta", href: base },
    { clave: "insignias", texto: "Insignias", href: `${base}/insignias` },
    // Los golazos salen del feed (bloque 5 del recorrido)
    { clave: "golazos", texto: "Golazos" },
    { clave: "stats", texto: "Stats", href: `${base}/stats` },
  ];
  const clasePestana = "etiqueta inline-flex min-h-11 items-center border-b-[3px] text-[15px] font-extrabold tracking-[0.1em]";
  return (
    <section className="flex flex-col gap-3 px-4 pt-3.5">
      <div className="flex items-center gap-3">
        <Iniciales nombre={nombre} tamano={56} aro className="text-[18px]" />
        <div className="min-w-0 flex-1">
          <h1 className="titular-momento truncate text-[30px] leading-[0.95]">{nombre}</h1>
          <p className="truncate text-xs text-muted-foreground">{detalle}</p>
        </div>
        {insignias && (
          <p className="flex shrink-0 flex-col items-end">
            <span className="font-display leading-none font-black">
              <span className="text-[30px] text-role">{insignias.ganadas}</span>
              <span className="text-[16px]">/{insignias.total}</span>
            </span>
            <span className="etiqueta text-[10px] tracking-[0.14em] text-muted-foreground">Insignias</span>
          </p>
        )}
      </div>
      <nav aria-label="Secciones del perfil" className="-mx-4 flex gap-5 border-b border-border px-4">
        {pestanas.map((p) =>
          p.href ? (
            <Link
              key={p.clave}
              href={p.href}
              aria-current={p.clave === activa ? "page" : undefined}
              className={cn(clasePestana, p.clave === activa ? "border-role text-role" : "border-transparent text-muted-foreground")}
            >
              {p.texto}
            </Link>
          ) : (
            <AccionPronto key={p.clave} className={cn(clasePestana, "border-transparent text-muted-foreground")}>
              {p.texto}
            </AccionPronto>
          ),
        )}
      </nav>
    </section>
  );
}
