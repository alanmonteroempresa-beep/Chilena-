import Link from "next/link";
import { hoyCDMX } from "@/shared/lib/dates";
import { formatMXN } from "@/shared/lib/money";
import { nombreCorto } from "@/shared/lib/personas";
import { buttonVariants } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { ChipMarcador } from "@/shared/ui/chip-marcador";
import { coloresDe, Escudo } from "@/shared/ui/escudo";
import { Sobretitulo, Tarjeta, TarjetaRol, TituloSeccion } from "@/shared/ui/tarjeta";
import { correccionesParaElArbitro, partidosDelArbitro } from "../server/queries";
import { cuandoTeToca, horaCDMX, horarioCorto } from "../server/services/proximo";

type Partido = Awaited<ReturnType<typeof partidosDelArbitro>>["vienen"][number];

/**
 * Inicio del árbitro (pantalla 02 · PRD §7.5): sus partidos de hoy o los que vienen, el cobro de arbitraje
 * y lo último que cerró. Cada partido de hoy (o que sigue abierto) lleva a su cédula (pantallas 56a y 56b).
 */
export async function InicioArbitro({
  userId,
  ahora,
  ligaCorta,
  porCobrarCents = 0,
}: {
  userId: string;
  ahora: Date;
  ligaCorta?: string;
  /** Lo que la liga le debe de partidos ya pitados (`referee_payments`, módulo ligas) */
  porCobrarCents?: number;
}) {
  const [{ vienen, porCerrar, cerrados }, correcciones] = await Promise.all([partidosDelArbitro(userId, ahora), correccionesParaElArbitro(userId)]);
  const hoy = hoyCDMX(ahora);
  const dia = (p: Partido) => (p.scheduledAt ? hoyCDMX(p.scheduledAt) : null);
  const siguiente = vienen[0];
  const delDia = siguiente ? vienen.filter((p) => dia(p) === dia(siguiente)) : [];
  const esHoy = siguiente ? dia(siguiente) === hoy : false;
  const cobroCents = delDia.reduce((s, p) => s + (p.arbitrajeCents ?? 0), 0);
  const tarifas = new Set(delDia.map((p) => p.arbitrajeCents ?? 0));
  const cuando = siguiente?.scheduledAt ? cuandoTeToca(ahora, siguiente.scheduledAt) : null;

  return (
    <main className="flex flex-col gap-4 px-4 pt-3.5 pb-6">
      <header className="flex flex-col gap-1">
        <Sobretitulo className="text-role">Árbitro{ligaCorta ? ` · ${ligaCorta}` : ""}</Sobretitulo>
        <h1 className="titular-momento text-[40px]">{esHoy ? "Mis partidos de hoy" : "Mis partidos"}</h1>
        <p className="text-sm text-muted-foreground">
          {esHoy
            ? `${delDia.length} ${delDia.length === 1 ? "partido" : "partidos"} hoy.`
            : cuando
              ? `Hoy no pitas. Te toca ${cuando.toLowerCase()}.`
              : "Todavía no tienes partidos asignados."}
        </p>
      </header>

      {(delDia.length > 0 || porCobrarCents > 0) && (
        <TarjetaRol className="flex flex-col gap-1">
          <Sobretitulo className="text-white/80">
            Cobro de arbitraje{cuando ? ` · ${esHoy ? "hoy" : cuando.toLowerCase()}` : ""}
          </Sobretitulo>
          {delDia.length > 0 && (
            <>
              <span className="font-display text-[44px] leading-none font-black">
                {formatMXN(cobroCents)}
              </span>
              <span className="text-[13px] text-white/80">
                {delDia.length} {delDia.length === 1 ? "partido" : "partidos"}
                {tarifas.size === 1 ? ` × ${formatMXN([...tarifas][0])}` : ""} · se paga al cerrar cédula
              </span>
            </>
          )}
          {porCobrarCents > 0 && (
            <span className="text-[13px] font-semibold">
              Te deben {formatMXN(porCobrarCents)} de partidos pasados
            </span>
          )}
        </TarjetaRol>
      )}

      {correcciones > 0 && (
        <Tarjeta className="border-danger/40 bg-danger/12 p-3.5 text-sm font-semibold">
          Te piden corregir {correcciones === 1 ? "una cédula" : `${correcciones} cédulas`}: contesta para que puedan firmar.
        </Tarjeta>
      )}

      {porCerrar.length > 0 && (
        <section className="flex flex-col gap-2.5" aria-labelledby="arbitro-por-cerrar">
          <TituloSeccion>
            <span id="arbitro-por-cerrar">Cédulas abiertas</span>
          </TituloSeccion>
          {porCerrar.map((p) => (
            <PartidoQueViene key={p.id} p={p} conDia conCedula />
          ))}
        </section>
      )}

      {vienen.length > 0 && (
        <section className="flex flex-col gap-2.5" aria-labelledby="arbitro-vienen">
          <TituloSeccion>
            <span id="arbitro-vienen">{esHoy ? "Hoy" : "Lo que viene"}</span>
          </TituloSeccion>
          {vienen.map((p) => (
            <PartidoQueViene key={p.id} p={p} conDia={dia(p) !== hoy} conCedula={dia(p) === hoy || p.status === "POR_FIRMAR" || p.status === "FINALIZADO"} />
          ))}
        </section>
      )}

      {cerrados.length > 0 && (
        <section className="flex flex-col gap-2.5" aria-labelledby="arbitro-cerrados">
          <TituloSeccion>
            <span id="arbitro-cerrados">Ya cerrados</span>
          </TituloSeccion>
          <Tarjeta className="divide-y divide-border">
            {cerrados.map((p) => (
              <Link key={p.id} href={`/partido/${p.id}`} className="flex flex-col gap-1.5 px-3.5 py-3">
                <span className="etiqueta text-[11px] tracking-[0.12em] text-muted-foreground">
                  J{p.round?.numero} · {p.scheduledAt ? horarioCorto(p.scheduledAt, p.field?.nombre) : ""}
                </span>
                <ChipMarcador
                  local={{
                    ...coloresDe(p.homeTeam),
                    siglas: p.homeTeam.siglas ?? "",
                    nombre: nombreCorto(p.homeTeam.nombre).toUpperCase(),
                  }}
                  visitante={{
                    ...coloresDe(p.awayTeam),
                    siglas: p.awayTeam.siglas ?? "",
                    nombre: nombreCorto(p.awayTeam.nombre).toUpperCase(),
                  }}
                  golesLocal={p.homeScore ?? 0}
                  golesVisitante={p.awayScore ?? 0}
                  fuente={{ tipo: "cedula" }}
                  conNombres
                />
              </Link>
            ))}
          </Tarjeta>
        </section>
      )}
    </main>
  );
}

/** "Llenar cédula" el día del partido; después, "Ver cédula" (por firmar o firmada) */
function PartidoQueViene({ p, conDia, conCedula = false }: { p: Partido; conDia: boolean; conCedula?: boolean }) {
  const chip =
    p.status === "EN_JUEGO" ? (
      <Chip tono="rojo">En vivo</Chip>
    ) : p.status === "POR_FIRMAR" ? (
      <Chip tono="ambar">Por firmar</Chip>
    ) : p.status === "FINALIZADO" ? (
      <Chip tono="verde">Firmada</Chip>
    ) : p.refereeStatus === "ASIGNADO" ? (
      <Chip tono="ambar">Por confirmar</Chip>
    ) : (
      <Chip tono="verde">Confirmado</Chip>
    );
  return (
    <Link href={conCedula ? `/arbitro/cedula/${p.id}` : `/partido/${p.id}`} className="block">
      <Tarjeta className="flex flex-col gap-2.5 p-3.5">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-[26px] leading-none font-black">
            {p.scheduledAt ? horaCDMX(p.scheduledAt) : "—"}
          </span>
          <span className="flex-1 text-[13px] text-muted-foreground">
            {[
              conDia && p.scheduledAt ? horarioCorto(p.scheduledAt).split(" · ")[0] : null,
              p.field?.nombre,
              `J${p.round?.numero}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          {chip}
        </div>
        <div className="flex items-center gap-2">
          <Escudo {...coloresDe(p.homeTeam)} tamano={26} />
          <span className="font-display flex-1 truncate text-[19px] font-black uppercase italic">
            {nombreCorto(p.homeTeam.nombre)}
          </span>
          <span className="etiqueta text-[13px] text-muted-foreground">VS</span>
          <span className="font-display flex-1 truncate text-right text-[19px] font-black uppercase italic">
            {nombreCorto(p.awayTeam.nombre)}
          </span>
          <Escudo {...coloresDe(p.awayTeam)} tamano={26} />
        </div>
        {conCedula && (
          <span className={buttonVariants({ variant: p.status === "PROGRAMADO" || p.status === "EN_JUEGO" ? "lima" : "quieto", size: "cta", className: "w-full border border-border" })}>
            {p.status === "PROGRAMADO" || p.status === "EN_JUEGO" ? "Llenar cédula" : "Ver cédula"}
          </span>
        )}
      </Tarjeta>
    </Link>
  );
}
