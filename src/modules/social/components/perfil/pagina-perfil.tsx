import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { HexagonoInsignia, propsDeCarta, type DatosDelJugador } from "@/modules/carta/server-api";
import { cn } from "@/shared/lib/utils";
import { CartaCrack } from "@/shared/ui/carta-crack";
import { Sobretitulo, Tarjeta } from "@/shared/ui/tarjeta";
import { BotonSeguir } from "../boton-seguir";
import { Porra } from "../porra/porra";

const formatoCorto = new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 });

/**
 * Perfil público del jugador (pantalla 06 · PRD §4.2): su carta, sus números del torneo, sus seguidores
 * e insignias. Lo ve cualquiera, con o sin cuenta; solo `publicUserSelect` (regla 8).
 */
export function PaginaPerfil({
  d,
  esPropio,
  yo,
  siguiendo,
}: {
  d: DatosDelJugador;
  esPropio: boolean;
  yo: string | null;
  siguiendo: boolean;
}) {
  const base = `/j/${d.persona.username}`;
  if (!d.esJugador) {
    return (
      <main className="flex flex-col gap-3 px-4 pt-4 pb-6">
        <Tarjeta className="flex flex-col gap-1 p-4">
          <Sobretitulo className="text-role">En Chilena</Sobretitulo>
          <p className="text-sm">
            {formatoCorto.format(d.persona.followersCount)} seguidores · sigue a {formatoCorto.format(d.persona.followingCount)}
          </p>
          <p className="text-xs text-muted-foreground">El perfil de aficionado y de árbitro llega pronto (pantallas 38 y 39).</p>
        </Tarjeta>
        {!esPropio && <BotonSeguir persona={d.persona.id} siguiendo={siguiendo} conSesion={Boolean(yo)} className="w-full" />}
        <div id="porra">
          <Porra muroDe={d.persona.id} yo={yo} />
        </div>
      </main>
    );
  }
  const ganadas = d.insignias.filter((i) => i.estado.veces > 0);
  const cajas = [
    d.stats && d.torneo ? { valor: String(d.stats.goles), texto: `goles en el ${d.torneo.nombre}`, acento: true } : null,
    d.posicionGoleo ? { valor: `#${d.posicionGoleo}`, texto: "del goleo" } : null,
    d.stats && d.stats.rachaGoles >= 2
      ? { valor: String(d.stats.rachaGoles), texto: "partidos anotando", fuego: true }
      : d.stats
        ? { valor: String(d.stats.rachaAsistencia), texto: "domingos sin faltar" }
        : null,
    { valor: formatoCorto.format(d.persona.followersCount), texto: d.persona.followersCount === 1 ? "seguidor" : "seguidores" },
  ].filter((c): c is NonNullable<typeof c> => c != null);

  return (
    <main className="flex flex-col gap-4 px-4 pt-4 pb-6">
      <Link
        href={`${base}/carta`}
        aria-label={esPropio ? "Ver mi carta en grande" : "Ver su carta en grande"}
        className="flex flex-col items-center gap-2"
      >
        <CartaCrack {...propsDeCarta(d)} ancho={200} />
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          Toca la carta para verla en grande <ArrowRight aria-hidden className="size-3.5" />
        </span>
      </Link>

      <div className="grid grid-cols-2 gap-2">
        {cajas.map((c) => (
          <Tarjeta key={c.texto} className="flex flex-col gap-1 p-3">
            <span className={cn("font-display flex items-center gap-1 text-[30px] leading-none font-black", "acento" in c && c.acento && "text-role")}>
              {"fuego" in c && c.fuego && <Flame aria-hidden className="size-6 text-amarilla" />}
              {c.valor}
            </span>
            <span className="etiqueta text-[10px] leading-tight tracking-[0.12em] text-muted-foreground">{c.texto}</span>
          </Tarjeta>
        ))}
      </div>

      {!esPropio && (
        <div className="flex gap-2">
          <BotonSeguir persona={d.persona.id} siguiendo={siguiendo} conSesion={Boolean(yo)} className="flex-1" />
          <a
            href="#porra"
            aria-label="Echarle porra"
            className="etiqueta inline-flex h-12 items-center gap-1.5 rounded-lg border border-border bg-surface px-5 text-sm font-extrabold"
          >
            🔥
          </a>
        </div>
      )}

      <Tarjeta className="flex flex-col gap-3 p-3.5">
        <div className="flex items-center justify-between">
          <Sobretitulo className="text-muted-foreground">
            Insignias · {ganadas.length} de {d.insignias.length}
          </Sobretitulo>
          <Link href={`${base}/insignias`} className="etiqueta inline-flex min-h-11 items-center gap-1 text-xs font-extrabold tracking-[0.12em] text-role">
            Ver todas <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </div>
        {ganadas.length ? (
          <ul className="grid grid-cols-4 gap-2">
            {ganadas.slice(0, 8).map((i) => (
              <li key={i.code} className="flex flex-col items-center gap-1 text-center">
                <HexagonoInsignia icon={i.icon} ganada tamano={40} />
                <span className="text-[11px] leading-tight font-semibold">
                  {i.nombre}
                  {i.estado.veces > 1 ? ` ×${i.estado.veces}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía ninguna: la primera sale jugando.</p>
        )}
      </Tarjeta>

      <div id="porra">
        <Porra muroDe={d.persona.id} yo={yo} />
      </div>
    </main>
  );
}
