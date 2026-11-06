import { cn } from "@/shared/lib/utils";
import { Chip } from "@/shared/ui/chip";
import { Sobretitulo, Tarjeta, TituloSeccion } from "@/shared/ui/tarjeta";
import type { DatosDelJugador } from "../server/jugador";
import { HexagonoInsignia, textoRareza } from "./insignia";

/** Grupos de la colección en el orden del diseño (pantalla 28) */
const GRUPOS: { titulo: string; categorias: string[] }[] = [
  { titulo: "Goles", categorias: ["GOLES"] },
  { titulo: "Portero", categorias: ["PORTERO"] },
  { titulo: "Constancia", categorias: ["CONSTANCIA"] },
  { titulo: "Votadas", categorias: ["VOTADAS"] },
  { titulo: "Equipo", categorias: ["EQUIPO"] },
  { titulo: "Fair play y especiales", categorias: ["FAIR_PLAY", "ESPECIAL"] },
];

type Insignia = DatosDelJugador["insignias"][number];

/**
 * Colección de insignias (pantallas 14 y 28): las ganadas a color con su rareza, las que faltan en gris
 * con su progreso o una pista con datos reales, y "la que tienes más cerca".
 */
export function ColeccionInsignias({ d, esPropio }: { d: DatosDelJugador; esPropio: boolean }) {
  const cercana = d.masCercana && d.insignias.find((i) => i.code === d.masCercana!.code);
  return (
    <div className="flex flex-col gap-4 px-4 pt-3 pb-6">
      {cercana && d.masCercana?.meta && (
        <Tarjeta className="flex flex-col gap-2 border-brand-lime/60 p-3.5">
          <Sobretitulo className="text-muted-foreground">{esPropio ? "La que tienes más cerca" : "La que tiene más cerca"}</Sobretitulo>
          <div className="flex items-end justify-between gap-3">
            <p className="titular-momento text-[30px]">
              {cercana.nombre} · {esPropio ? "te faltan" : "le faltan"} {d.masCercana.meta - (d.masCercana.progreso ?? 0)}
            </p>
            <span className="font-display text-[24px] leading-none font-black whitespace-nowrap">
              {d.masCercana.progreso}/{d.masCercana.meta}
            </span>
          </div>
          <Barra valor={d.masCercana.progreso ?? 0} meta={d.masCercana.meta} />
        </Tarjeta>
      )}
      {GRUPOS.map((g) => {
        const suyas = d.insignias.filter((i) => g.categorias.includes(i.categoria));
        if (!suyas.length) return null;
        const ganadas = suyas.filter((i) => i.estado.veces > 0).length;
        return (
          <section key={g.titulo} aria-labelledby={`grupo-${g.categorias[0]}`} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <span aria-hidden className={cn("size-2.5 rounded-[3px]", ganadas ? "bg-brand-lime" : "bg-surface-2")} />
              <TituloSeccion className="flex-1">
                <span id={`grupo-${g.categorias[0]}`}>{g.titulo}</span>
              </TituloSeccion>
              <span className="etiqueta text-[11px] tracking-[0.12em] text-muted-foreground">
                {ganadas} de {suyas.length}
              </span>
            </div>
            <ul className="grid grid-cols-3 gap-2">
              {suyas.map((i) => (
                <FichaInsignia key={i.code} i={i} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function FichaInsignia({ i }: { i: Insignia }) {
  const { veces, progreso, meta, pista } = i.estado;
  const ganada = veces > 0;
  return (
    <li>
      <Tarjeta className="flex h-full flex-col items-center gap-1.5 px-1.5 pt-3 pb-2.5 text-center">
        <HexagonoInsignia icon={i.icon} ganada={ganada} />
        <span className={cn("text-xs leading-tight font-semibold", !ganada && "text-muted-foreground")}>
          {i.nombre}
          <span className="sr-only">{ganada ? `, ganada${veces > 1 ? ` ${veces} veces` : ""}` : ", todavía no"}</span>
        </span>
        <span className="mt-auto flex w-full flex-col items-center gap-1">
          {ganada ? (
            <Chip tono="lima">
              {i.rareza != null ? textoRareza(i.rareza) : "Ganada"}
              {veces > 1 ? ` · ×${veces}` : ""}
            </Chip>
          ) : meta ? (
            <>
              <Chip>
                {progreso ?? 0} de {meta}
              </Chip>
              <Barra valor={progreso ?? 0} meta={meta} delgada />
            </>
          ) : (
            <Chip className="h-auto max-w-full py-0.5 text-center leading-tight whitespace-normal">{pista ?? "Todavía no"}</Chip>
          )}
        </span>
      </Tarjeta>
    </li>
  );
}

function Barra({ valor, meta, delgada = false }: { valor: number; meta: number; delgada?: boolean }) {
  const pct = Math.min(100, Math.round((valor / meta) * 100));
  return (
    <span aria-hidden className={cn("block w-full overflow-hidden rounded-full bg-surface-2", delgada ? "h-1" : "h-1.5")}>
      <span className="block h-full rounded-full bg-brand-lime" style={{ width: `${pct}%` }} />
    </span>
  );
}
