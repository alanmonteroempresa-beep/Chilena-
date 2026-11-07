import Link from "next/link";
import { CalendarDays, ChevronRight, Goal, Megaphone, Swords, Table2, Ticket, Vote } from "lucide-react";
import { horaCDMX, horarioCorto } from "@/modules/partidos";
import { nombreCorto, nombreVisible } from "@/shared/lib/personas";
import { cn } from "@/shared/lib/utils";
import { AccionPronto } from "@/shared/ui/accion-pronto";
import { buttonVariants } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { coloresDe, Escudo } from "@/shared/ui/escudo";
import { Iniciales } from "@/shared/ui/iniciales";
import { Sobretitulo, Tarjeta, TarjetaRol } from "@/shared/ui/tarjeta";
import type { datosMiLiga } from "../../server/mi-liga";

type Datos = NonNullable<Awaited<ReturnType<typeof datosMiLiga>>>;

/** Votaciones y quiniela (pantallas 12 y 13): un toque y listo */
const ACCESOS = [
  { titulo: "Votaciones", Icono: Vote, href: "/mi-liga/votaciones", texto: "¿Quién se la rifó? Vota el MVP" },
  { titulo: "Quiniela", Icono: Ticket, href: "/mi-liga/quiniela", texto: "¿Cuánto queda? Sin dinero, puro orgullo" },
];

/** Lo que el hub trae pero llega con su fase (rankings, bolsa) */
const PRONTO = [
  { titulo: "Rankings y pique", Icono: Swords },
  { titulo: "Bolsa del llano", Icono: Megaphone },
];

/**
 * Hub de Mi liga (pantalla Mi liga · celular): cada acceso trae su adelanto. El rol de la jornada con el
 * partido de tu equipo, la tabla, el goleo, las votaciones y la quiniela; lo demás avisa que llega pronto.
 */
export function HubMiLiga({ d, yo, esJugador }: { d: Datos; yo: string; esJugador: boolean }) {
  const p = d.destacado;
  const ultima = d.tabla.at(-1);
  return (
    <main className="flex flex-col gap-3 px-4 pt-3 pb-6">
      {p && (
        <TarjetaRol className="flex flex-col gap-2.5">
          <Link href="/mi-liga/rol" className="flex items-center justify-between gap-2">
            <Sobretitulo className="flex items-center gap-1.5 text-white/90">
              <CalendarDays aria-hidden className="size-4" />
              Rol de juegos{d.jornada ? ` · J${d.jornada}` : ""}
            </Sobretitulo>
            <span className="etiqueta flex items-center gap-1 text-[11px] tracking-[0.12em] text-white/85">
              Ver rol <ChevronRight aria-hidden className="size-4" />
            </span>
          </Link>
          <Link href={`/partido/${p.id}`} className="flex flex-col gap-1">
            <p className="titular-momento flex flex-wrap items-baseline gap-x-2 text-[36px] leading-[0.9]">
              {nombreCorto(p.homeTeam.nombre)}
              <span className="text-[22px] text-brand-lime">vs</span>
              {nombreCorto(p.awayTeam.nombre)}
            </p>
            <span className="text-xs text-white/80">
              {p.scheduledAt ? horarioCorto(p.scheduledAt, p.field?.nombre) : ""}
              {d.posicion(p.homeTeam.id) && d.posicion(p.awayTeam.id)
                ? ` · ${d.posicion(p.homeTeam.id)}º vs ${d.posicion(p.awayTeam.id)}º de la tabla`
                : ""}
            </span>
          </Link>
          {d.esDeMiEquipo && esJugador && p.status === "PROGRAMADO" && (
            <AccionPronto className={buttonVariants({ variant: "lima", size: "cta", className: "w-full" })}>
              Confirmo que voy
            </AccionPronto>
          )}
          {d.resto.length > 0 && (
            <ul className="flex flex-wrap gap-x-3 gap-y-1 border-t border-white/20 pt-2 text-[11px] text-white/80">
              {d.resto.map((r) => (
                <li key={r.id}>
                  <Link href={`/partido/${r.id}`}>
                    <b className="text-white">{r.scheduledAt ? horaCDMX(r.scheduledAt) : ""}</b> {nombreCorto(r.homeTeam.nombre)} vs{" "}
                    {nombreCorto(r.awayTeam.nombre)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TarjetaRol>
      )}

      <Tarjeta className="flex flex-col gap-1.5 p-3.5">
        <EncabezadoTarjeta href="/mi-liga/tabla" Icono={Table2} titulo={`Tabla${d.jornada ? ` · J${d.jornada - 1}` : ""}`} />
        <ol className="flex flex-col">
          {d.tabla.slice(0, 3).map((f) => {
            const mio = d.miEquipo?.id === f.tournamentTeam.team.id;
            return (
              <li key={f.tournamentTeam.team.id} className={cn("flex h-10 items-center gap-2.5 rounded-lg px-2 text-sm", mio && "bg-role/10 font-semibold")}>
                <span className="etiqueta w-4 text-muted-foreground">{f.posicion}</span>
                <Escudo {...coloresDe(f.tournamentTeam.team)} tamano={14} conSiglas={false} />
                <span className="min-w-0 flex-1 truncate">{f.tournamentTeam.team.nombre}</span>
                <span className={cn("font-display text-[20px] font-black", mio && "text-role")}>{f.pts}</span>
              </li>
            );
          })}
        </ol>
        {d.tabla.length > 3 && ultima && (
          <p className="text-xs text-muted-foreground">
            +{d.tabla.length - 3} equipos · {nombreCorto(ultima.tournamentTeam.team.nombre)} cierra con {ultima.pts}
          </p>
        )}
      </Tarjeta>

      {d.goleo.length > 0 && (
        <Tarjeta className="flex flex-col gap-2 p-3.5">
          <EncabezadoTarjeta href="/mi-liga/goleo" Icono={Goal} titulo="Goleo" />
          <Link href={`/j/${d.goleo[0].user.username}`} className="flex items-center gap-3">
            <Iniciales nombre={nombreVisible(d.goleo[0].user)} tamano={48} aro />
            <span className="min-w-0 flex-1">
              <span className="etiqueta block text-[10px] tracking-[0.14em] text-role">
                Líder{d.goleo[0].userId === yo ? " · tú" : ""}
              </span>
              <span className="block truncate font-semibold">{nombreVisible(d.goleo[0].user)}</span>
              {d.goleo[0].equipo && <span className="block truncate text-xs text-muted-foreground">{d.goleo[0].equipo.nombre}</span>}
            </span>
            <span className="flex flex-col items-end">
              <span className="titular-momento text-[52px] leading-[0.8] text-role">{d.goleo[0].goles}</span>
              <span className="etiqueta text-[10px] tracking-[0.14em] text-muted-foreground">Goles</span>
            </span>
          </Link>
          <ol className="flex flex-col gap-0.5 border-t border-border pt-2 text-[13px]" start={2}>
            {d.goleo.slice(1).map((g, i) => (
              <li key={g.userId} className="flex items-center gap-2">
                <span className="etiqueta w-4 text-muted-foreground">{i + 2}</span>
                <Link href={`/j/${g.user.username}`} className="min-w-0 flex-1 truncate">
                  {nombreVisible(g.user)}
                  {g.equipo ? <span className="text-muted-foreground"> · {nombreCorto(g.equipo.nombre)}</span> : null}
                </Link>
                <span className="etiqueta font-extrabold">{g.goles}</span>
              </li>
            ))}
          </ol>
        </Tarjeta>
      )}

      <ul className="grid grid-cols-2 gap-2.5">
        {ACCESOS.map(({ titulo, Icono, href, texto }) => (
          <li key={titulo}>
            <Link
              href={href}
              className="flex h-full min-h-24 w-full flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-3.5 text-left shadow-[0_1px_2px_rgba(7,9,12,0.05)]"
            >
              <Sobretitulo className="flex items-center gap-1.5">
                <Icono aria-hidden className="size-4 text-role" />
                {titulo}
              </Sobretitulo>
              <span className="text-[13px] leading-snug text-muted-foreground">{texto}</span>
            </Link>
          </li>
        ))}
        {PRONTO.map(({ titulo, Icono }) => (
          <li key={titulo}>
            <AccionPronto
              aviso={`${titulo} llega pronto`}
              className="flex h-full min-h-24 w-full flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-3.5 text-left shadow-[0_1px_2px_rgba(7,9,12,0.05)]"
            >
              <Sobretitulo className="flex items-center gap-1.5 text-muted-foreground">
                <Icono aria-hidden className="size-4" />
                {titulo}
              </Sobretitulo>
              <Chip>Llega pronto</Chip>
            </AccionPronto>
          </li>
        ))}
      </ul>
    </main>
  );
}

function EncabezadoTarjeta({ href, Icono, titulo }: { href: string; Icono: typeof Table2; titulo: string }) {
  return (
    <Link href={href} className="flex min-h-8 items-center justify-between">
      <Sobretitulo className="flex items-center gap-1.5">
        <Icono aria-hidden className="size-4 text-role" />
        {titulo}
      </Sobretitulo>
      <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
    </Link>
  );
}
