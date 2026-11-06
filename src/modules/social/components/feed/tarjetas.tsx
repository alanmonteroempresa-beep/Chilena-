import Link from "next/link";
import { MessageCircle, Sparkles, Zap } from "lucide-react";
import { formatCDMX } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";
import { AccionPronto } from "@/shared/ui/accion-pronto";
import { Chip } from "@/shared/ui/chip";
import { coloresDe, Escudo } from "@/shared/ui/escudo";
import { Iniciales } from "@/shared/ui/iniciales";
import { Sobretitulo, Tarjeta } from "@/shared/ui/tarjeta";
import type { AutoPost, Marcador } from "../../server/services/auto-posts";

const URL_APP = (process.env.NEXT_PUBLIC_APP_URL ?? "https://chilena.vercel.app").replace(/\/$/, "");
const marcadorTexto = (m: Marcador) => `${m.local.corto} ${m.golesLocal}–${m.golesVisita} ${m.visita.corto}`;
const dia = (ms: number) => (ms ? formatCDMX(new Date(ms), "EEE d").replace(".", "") : "");

/** "DE CHILENA" con la última palabra en lima (pantalla 10) */
function Grande({ texto, className }: { texto: string; className?: string }) {
  const palabras = texto.toUpperCase().split(" ");
  const ultima = palabras.pop();
  return (
    <span className={cn("titular-momento block", className)}>
      {palabras.length ? `${palabras.join(" ")} ` : ""}
      <span className="text-brand-lime">{ultima}</span>
    </span>
  );
}

/** Reacciones (🔥 Fuego · ⚽ Golazo · 🏆 Trofeo · 💬) y compartir por WhatsApp (PRD §6.1) */
function Pie({ texto, ruta }: { texto: string; ruta: string }) {
  const href = `https://wa.me/?text=${encodeURIComponent(`${texto} ${URL_APP}${ruta}`)}`;
  return (
    <div className="flex items-center gap-1.5 px-3.5 pb-3.5">
      {(["🔥", "⚽", "🏆"] as const).map((e, i) => (
        <AccionPronto
          key={e}
          aviso="Reaccionar llega pronto"
          aria-label={["Fuego", "Golazo", "Trofeo"][i]}
          className={cn(
            "inline-flex h-[30px] items-center rounded-full px-2.5 text-[13px]",
            i === 0 ? "bg-brand-lime text-ink" : "bg-surface-2",
          )}
        >
          {e}
        </AccionPronto>
      ))}
      <AccionPronto
        aviso="Los comentarios llegan pronto"
        aria-label="Comentar"
        className="inline-flex h-[30px] items-center rounded-full bg-surface-2 px-2.5"
      >
        <MessageCircle aria-hidden className="size-4" />
      </AccionPronto>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="etiqueta ml-auto inline-flex h-[34px] items-center gap-1.5 rounded-lg bg-whatsapp px-3 text-xs font-extrabold tracking-[0.12em] text-ink"
      >
        <MessageCircle aria-hidden className="size-4" />
        WhatsApp
      </a>
    </div>
  );
}

const chipAuto = <Chip tono="lima">⚡ Auto</Chip>;

function TarjetaGol({ p }: { p: Extract<AutoPost, { tipo: "AUTO_GOL" }> }) {
  return (
    <Tarjeta className="overflow-hidden">
      <div className="flex items-center gap-2.5 p-3">
        <Link href={`/j/${p.autor.username}`} aria-label={`Perfil de ${p.autor.nombre}`}>
          <Iniciales nombre={p.autor.nombre} tamano={36} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{p.titular}</p>
          <p className="truncate text-xs text-muted-foreground">
            {p.marcador.local.corto} vs {p.marcador.visita.corto}
            {p.cancha ? ` · ${p.cancha}` : ""}
          </p>
        </div>
        {chipAuto}
      </div>
      <Link
        href={`/partido/${p.matchId}`}
        className="flex h-[200px] flex-col justify-between bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-brand-blue)_32%,var(--color-ink)),var(--color-ink)_70%)] p-3.5 text-white"
      >
        <span className="flex items-center justify-between">
          {p.golazo ? <Chip tono="lima">⚡ Golazo</Chip> : <span />}
          {p.minuto != null && <span className="font-display text-[24px] font-black">{p.minuto}&apos;</span>}
        </span>
        <span>
          <Grande texto={p.grande} className="text-[52px] leading-[0.84]" />
          <span className="etiqueta mt-1.5 block text-[13px] font-extrabold tracking-[0.12em]">
            {p.marcador.local.corto}{" "}
            <span className="rounded-[3px] bg-white px-1.5 text-ink">
              {p.marcador.golesLocal}–{p.marcador.golesVisita}
            </span>{" "}
            {p.marcador.visita.corto}
          </span>
        </span>
      </Link>
      <div className="pt-3" />
      <Pie texto={`${p.titular} · ${marcadorTexto(p.marcador)} · J${p.jornada}`} ruta={`/partido/${p.matchId}`} />
    </Tarjeta>
  );
}

function TarjetaCronica({ p }: { p: Extract<AutoPost, { tipo: "AUTO_CRONICA" }> }) {
  const palabras = p.titular.split(" ");
  const ultima = palabras.pop();
  return (
    <Tarjeta className="overflow-hidden">
      <Link href={`/partido/${p.matchId}`} className="flex flex-col gap-2 p-3.5">
        <span className="flex items-center gap-2">
          <span className="etiqueta inline-flex h-5 items-center gap-1 rounded-md bg-role px-1.5 text-[10px] font-extrabold tracking-[0.12em] text-white dark:text-ink">
            <Sparkles aria-hidden className="size-3" />
            Crónica Chilena
          </span>
          <span className="text-xs text-muted-foreground">Con datos de la cédula · {dia(p.validado)}</span>
        </span>
        <span className="titular-momento text-[34px] leading-[0.9]">
          {palabras.join(" ")} <span className="text-role">{ultima}</span>
        </span>
        {p.cuerpo.map((linea) => (
          <span key={linea} className="text-[13px] leading-snug">
            {linea}
          </span>
        ))}
      </Link>
      <Pie texto={`${p.titular} ${marcadorTexto(p.marcador)} · J${p.jornada}`} ruta={`/partido/${p.matchId}`} />
    </Tarjeta>
  );
}

function TarjetaResultado({ p }: { p: Extract<AutoPost, { tipo: "AUTO_RESULTADO" }> }) {
  const lado = (e: Marcador["local"]) => (
    <span className="flex w-20 flex-col items-center gap-1">
      <Escudo {...coloresDe(e)} tamano={36} forma="escudo" />
      <span className="etiqueta truncate text-[11px] font-extrabold tracking-[0.1em]">{e.corto}</span>
    </span>
  );
  return (
    <Tarjeta className="overflow-hidden">
      <Link href={`/partido/${p.matchId}`} className="flex flex-col gap-3 p-3.5">
        <span className="flex items-center justify-between">
          <Sobretitulo className="text-muted-foreground">Resultado final · J{p.jornada}</Sobretitulo>
          <Chip tono="lima">
            <Zap aria-hidden className="mr-0.5 size-3" />
            Desde la cédula
          </Chip>
        </span>
        <span className="flex items-center justify-between">
          {lado(p.marcador.local)}
          <span className="font-display text-[54px] leading-none font-black">
            {p.marcador.golesLocal}–{p.marcador.golesVisita}
          </span>
          {lado(p.marcador.visita)}
        </span>
        {p.goleadores.map((g) => (
          <span key={g.equipoId} className="text-center text-xs text-muted-foreground">
            ⚽ {g.texto}
          </span>
        ))}
      </Link>
      <Pie texto={`Final: ${marcadorTexto(p.marcador)} · J${p.jornada}`} ruta={`/partido/${p.matchId}`} />
    </Tarjeta>
  );
}

function TarjetaTabla({ p }: { p: Extract<AutoPost, { tipo: "AUTO_TABLA" }> }) {
  return (
    <Tarjeta className="flex flex-col gap-3 p-3.5">
      <span className="flex items-center justify-between">
        <Sobretitulo className="text-muted-foreground">Fin de jornada {p.jornada}</Sobretitulo>
        {chipAuto}
      </span>
      <span className="titular-momento text-[30px]">Así quedó la J{p.jornada}</span>
      <div className="grid grid-cols-2 gap-3 text-[13px]">
        <div className="flex flex-col gap-1.5">
          <Sobretitulo className="text-[10px] text-muted-foreground">Goleo</Sobretitulo>
          {p.goleo.map((g) => (
            <Link key={g.username} href={`/j/${g.username}`} className="flex items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate">{g.nombre}</span>
              <b className="font-display text-[16px]">{g.goles}</b>
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <Sobretitulo className="text-[10px] text-muted-foreground">Tabla</Sobretitulo>
          {p.tabla.map((t) => (
            <span key={t.equipo.id} className="flex items-center gap-1.5">
              <span className="etiqueta w-3 text-muted-foreground">{t.posicion}</span>
              <Escudo {...coloresDe(t.equipo)} tamano={12} conSiglas={false} />
              <span className="min-w-0 flex-1 truncate">{t.equipo.corto}</span>
              <b className="font-display text-[16px]">{t.pts}</b>
            </span>
          ))}
        </div>
      </div>
    </Tarjeta>
  );
}

function TarjetaRacha({ p }: { p: Extract<AutoPost, { tipo: "AUTO_RACHA" }> }) {
  return (
    <Tarjeta className="overflow-hidden">
      <Link href={`/j/${p.autor.username}`} className="flex items-center gap-3 p-3.5">
        <span aria-hidden className="text-[28px]">
          🔥
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">
            {p.autor.nombre} lleva {p.racha} partidos anotando
          </span>
          <span className="block text-xs text-muted-foreground">Racha · J{p.jornada}</span>
        </span>
        {chipAuto}
      </Link>
      <Pie texto={`🔥 ${p.autor.nombre} lleva ${p.racha} partidos anotando`} ruta={`/j/${p.autor.username}`} />
    </Tarjeta>
  );
}

function TarjetaInsignia({ p }: { p: Extract<AutoPost, { tipo: "AUTO_INSIGNIA" }> }) {
  return (
    <Tarjeta className="overflow-hidden">
      <Link href={`/j/${p.autor.username}/insignias`} className="flex items-center gap-3 p-3.5">
        <span
          aria-hidden
          className="inline-flex size-12 shrink-0 items-center justify-center bg-brand-lime text-[22px]"
          style={{ clipPath: "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)" }}
        >
          {p.insignia.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">
            {p.autor.nombre} ganó la insignia {p.insignia.nombre}
            {p.veces > 1 ? ` (×${p.veces})` : ""}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{p.insignia.descripcion}</span>
        </span>
        {chipAuto}
      </Link>
      <Pie texto={`🏅 ${p.autor.nombre} ganó la insignia ${p.insignia.nombre}`} ruta={`/j/${p.autor.username}/insignias`} />
    </Tarjeta>
  );
}

export function TarjetaPost({ p }: { p: AutoPost }) {
  switch (p.tipo) {
    case "AUTO_INSIGNIA":
      return <TarjetaInsignia p={p} />;
    case "AUTO_GOL":
      return <TarjetaGol p={p} />;
    case "AUTO_CRONICA":
      return <TarjetaCronica p={p} />;
    case "AUTO_RESULTADO":
      return <TarjetaResultado p={p} />;
    case "AUTO_TABLA":
      return <TarjetaTabla p={p} />;
    case "AUTO_RACHA":
      return <TarjetaRacha p={p} />;
  }
}
