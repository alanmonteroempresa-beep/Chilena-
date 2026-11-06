import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { horaCDMX } from "@/modules/partidos";
import { formatMXN } from "@/shared/lib/money";
import { nombreCorto, nombreDeArbitro } from "@/shared/lib/personas";
import { cn } from "@/shared/lib/utils";
import { AccionPronto } from "@/shared/ui/accion-pronto";
import { Chip } from "@/shared/ui/chip";
import { coloresDe, Escudo } from "@/shared/ui/escudo";
import { Sobretitulo, Tarjeta, TarjetaRol, TituloSeccion } from "@/shared/ui/tarjeta";
import { datosInicioLiga } from "../server/inicio";
import type { PendienteLiga } from "../server/services/resumen";

const TONO_PENDIENTE: Record<PendienteLiga["clave"], string> = {
  cedulas: "text-warning",
  reportes: "text-danger",
  "sin-arbitro": "text-warning",
  pagos: "text-danger",
};

/**
 * Inicio de la liga = Resumen del panel (pantalla 18 · PRD §5 y §7.11): lo que toca revisar, cómo va la
 * cobranza del mes, la jornada que viene y los pagos de cada equipo. Herramienta operativa, solo lectura.
 */
export async function InicioLiga({
  slugLiga,
  ahora,
  nombre,
  reportesAbiertos = 0,
}: {
  slugLiga: string;
  ahora: Date;
  /** Quién administra: "Don Toño" */
  nombre: string;
  /** Comentarios reportados sin atender (módulo social) */
  reportesAbiertos?: number;
}) {
  const d = await datosInicioLiga(slugLiga, ahora, reportesAbiertos);
  if (!d) return null;
  const siglas = d.torneo.liga.siglas ?? d.torneo.liga.nombre;
  const avance = d.cobrado.esperadoCents
    ? Math.round((d.cobrado.cobradoCents / d.cobrado.esperadoCents) * 100)
    : 0;
  return (
    <main className="flex flex-col gap-3 px-4 pt-3.5 pb-6">
      <TarjetaRol className="flex flex-col gap-2">
        <Sobretitulo className="text-white/75">
          {nombre} · {siglas}
          {d.jornada ? ` · J${d.jornada}` : ""}
        </Sobretitulo>
        <h1 className="titular-momento text-[46px] leading-[0.84]">
          {d.pendientes.length ? "Hoy toca" : "Todo al"}
          <br />
          <span className="text-brand-lime">{d.pendientes.length ? "revisar" : "corriente"}</span>
        </h1>
        <p className="text-xs text-white/75">
          {d.torneo.liga.nombre} · {d.torneo.nombre}
        </p>
      </TarjetaRol>

      {d.pendientes.length > 0 && (
        <Tarjeta>
          <ul className="divide-y divide-border">
            {d.pendientes.map((p) => (
              <li key={p.clave}>
                <AccionPronto className="flex min-h-16 w-full items-center gap-3 px-3.5 py-2.5 text-left">
                  <span
                    className={cn(
                      "font-display inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-[24px] font-black",
                      TONO_PENDIENTE[p.clave],
                    )}
                  >
                    {p.cantidad}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">{p.titulo}</span>
                    <span className="block truncate text-xs text-muted-foreground">{p.detalle}</span>
                  </span>
                  <ChevronRight aria-hidden className="size-5 text-muted-foreground" />
                </AccionPronto>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <Tarjeta className="col-span-2 flex flex-col gap-1.5 p-3.5">
          <Sobretitulo className="text-muted-foreground">Cobrado en {d.cobrado.mes}</Sobretitulo>
          <p className="flex items-baseline gap-2">
            <span className="font-display text-[34px] leading-none font-black">
              {formatMXN(d.cobrado.cobradoCents)}
            </span>
            <span className="text-sm text-muted-foreground">de {formatMXN(d.cobrado.esperadoCents)}</span>
          </p>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-label={`Cobrado en ${d.cobrado.mes}`}
            aria-valuenow={avance}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-brand-lime" style={{ width: `${avance}%` }} />
          </div>
        </Tarjeta>
        <Kpi titulo={d.jornada ? `Partidos J${d.jornada}` : "Partidos"} valor={d.partidos.length}>
          {d.sinArbitro > 0 ? (
            <span className="text-warning">{d.sinArbitro} sin árbitro</span>
          ) : (
            <span className="text-success">Con árbitro</span>
          )}
        </Kpi>
        <Kpi titulo="Sanciones activas" valor={d.sancionesActivas}>
          <span className="text-muted-foreground">en el torneo</span>
        </Kpi>
      </div>

      {d.partidos.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="liga-jornada">
          <TituloSeccion className="pt-2">
            <span id="liga-jornada">
              {d.diaJornada ?? "La jornada"}
              {d.jornada ? ` · J${d.jornada}` : ""}
            </span>
          </TituloSeccion>
          <Tarjeta>
            <ul className="divide-y divide-border">
              {d.partidos.map((p) => (
                <li key={p.id}>
                  <Link href={`/partido/${p.id}`} className="flex min-h-14 items-center gap-3 px-3.5 py-2.5">
                    <span className="font-display w-14 shrink-0 text-[22px] leading-none font-black">
                      {p.scheduledAt ? horaCDMX(p.scheduledAt) : "—"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-semibold">
                        <Escudo {...coloresDe(p.homeTeam)} tamano={14} conSiglas={false} />
                        <span className="truncate">
                          {nombreCorto(p.homeTeam.nombre)} vs {nombreCorto(p.awayTeam.nombre)}
                        </span>
                        <Escudo {...coloresDe(p.awayTeam)} tamano={14} conSiglas={false} />
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.field?.nombre}
                        {" · "}
                        {p.referee ? (
                          nombreDeArbitro(p.referee)
                        ) : (
                          <span className="font-semibold text-warning">Sin árbitro</span>
                        )}
                      </p>
                    </div>
                    {!p.referee ? (
                      <Chip tono="ambar">Pendiente</Chip>
                    ) : p.refereeStatus === "ASIGNADO" ? (
                      <Chip tono="ambar">Por confirmar</Chip>
                    ) : (
                      <Chip>Programado</Chip>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </section>
      )}

      <section className="flex flex-col gap-2" aria-labelledby="liga-pagos">
        <div className="flex items-end justify-between pt-2">
          <TituloSeccion>
            <span id="liga-pagos">Equipos y pagos</span>
          </TituloSeccion>
          <span className="text-xs text-muted-foreground">{d.equipos.length} inscritos</span>
        </div>
        <Tarjeta>
          <ul className="divide-y divide-border">
            {d.equipos.map(({ equipo, pendienteCents, vencido }) => (
              <li key={equipo.id} className="flex min-h-12 items-center gap-2.5 px-3.5 py-2">
                <Escudo {...coloresDe(equipo)} tamano={16} conSiglas={false} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{equipo.nombre}</span>
                {pendienteCents > 0 && (
                  <span className="font-display text-[18px] leading-none font-black">
                    {formatMXN(pendienteCents)}
                  </span>
                )}
                {vencido ? (
                  <Chip tono="rojo">Vencido</Chip>
                ) : pendienteCents > 0 ? (
                  <Chip tono="ambar">Pendiente</Chip>
                ) : (
                  <Chip tono="verde">Al corriente</Chip>
                )}
              </li>
            ))}
          </ul>
        </Tarjeta>
      </section>
    </main>
  );
}

function Kpi({ titulo, valor, children }: { titulo: string; valor: number; children: React.ReactNode }) {
  return (
    <Tarjeta className="flex flex-col gap-1 p-3.5">
      <Sobretitulo className="text-muted-foreground">{titulo}</Sobretitulo>
      <span className="font-display text-[32px] leading-none font-black">{valor}</span>
      <span className="text-xs font-semibold">{children}</span>
    </Tarjeta>
  );
}
