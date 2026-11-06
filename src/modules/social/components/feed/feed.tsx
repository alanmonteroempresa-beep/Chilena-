import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { TituloSeccion } from "@/shared/ui/tarjeta";
import { datosDelFeed, type VistaFeed } from "../../server/feed";
import { TarjetaPost } from "./tarjetas";

/** Pestañas del inicio (PRD §5: Para ti · Golazos · Siguiendo · export 03·05·10 claro) */
export function PestanasInicio({ vista }: { vista: VistaFeed }) {
  const pestanas: [VistaFeed, string, string][] = [
    ["para-ti", "Para ti", "/inicio"],
    ["golazos", "Golazos", "/inicio?vista=golazos"],
    ["siguiendo", "Siguiendo", "/inicio?vista=siguiendo"],
  ];
  return (
    <nav aria-label="Inicio" className="flex gap-[22px] border-b border-border px-[18px]">
      {pestanas.map(([clave, texto, href]) => (
        <Link
          key={clave}
          href={href}
          aria-current={clave === vista ? "page" : undefined}
          className={cn(
            "etiqueta inline-flex min-h-11 items-center border-b-[3px] text-[15px] font-extrabold tracking-[0.1em]",
            clave === vista ? "border-role text-role" : "border-transparent text-muted-foreground",
          )}
        >
          {texto}
        </Link>
      ))}
    </nav>
  );
}

const VACIO: Record<VistaFeed, string> = {
  "para-ti": "Cuando tu liga valide su primera jornada, aquí sale todo lo que dejó.",
  golazos: "Cuando tu liga valide su primera jornada, aquí salen todos los goles.",
  siguiendo: "Sigue a tu equipo o a un crack y aquí sale todo lo suyo, lo más nuevo arriba.",
};

/**
 * El feed automático (pantalla 10 · PRD §6.1): se llena solo con lo que capturó el árbitro y validó la
 * liga. Solo lectura: reaccionar y comentar llegan pronto; WhatsApp ya comparte.
 */
export async function Feed({
  contexto,
  vista,
  conTitulo = false,
  pagina = {},
}: {
  contexto: { userId: string; slugEquipo?: string; slugLiga?: string };
  vista: VistaFeed;
  conTitulo?: boolean;
  /** `jornada` (Para ti) o `antes` (cursor de Golazos y Siguiendo) */
  pagina?: { jornada?: number; antes?: string };
}) {
  const d = await datosDelFeed(contexto, vista, pagina);
  if (!d || d.jornada == null || d.posts.length === 0) {
    return <p className="mx-4 mt-4 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">{VACIO[vista]}</p>;
  }
  return (
    <section aria-labelledby="feed-titulo" className="flex flex-col gap-3 px-4 pt-3.5 pb-6">
      <TituloSeccion className={cn(!conTitulo && "sr-only")}>
        <span id="feed-titulo">Lo que dejó la J{d.jornada}</span>
      </TituloSeccion>
      <p className="flex items-center gap-2 rounded-xl border border-role/20 bg-role/10 px-3 py-2 text-[13px] font-semibold text-role">
        <Sparkles aria-hidden className="size-4 shrink-0" />
        <span>
          Se llenó solo con la cédula de la J{d.jornada}
          {d.arbitros.length ? <span className="font-normal text-muted-foreground"> · {d.arbitros.join(", ")}</span> : null}
        </span>
      </p>
      <ul className="flex flex-col gap-3">
        {d.posts.map((p) => (
          <li key={p.id}>
            <TarjetaPost p={p} />
          </li>
        ))}
      </ul>
      {d.mas && (
        <Link
          href={"jornada" in d.mas ? `/inicio?j=${d.mas.jornada}` : `/inicio?vista=${vista}&antes=${encodeURIComponent(d.mas.antes)}`}
          className="etiqueta inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-surface text-sm font-extrabold tracking-[0.12em]"
        >
          {"jornada" in d.mas ? `Ver lo que dejó la J${d.mas.jornada}` : "Ver más"}
        </Link>
      )}
    </section>
  );
}
