import Link from "next/link";
import { formatMXN } from "@/shared/lib/money";
import { nombreVisible } from "@/shared/lib/personas";
import { cn } from "@/shared/lib/utils";
import { AccionPronto } from "@/shared/ui/accion-pronto";
import { buttonVariants } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { Iniciales } from "@/shared/ui/iniciales";
import { Sobretitulo, Tarjeta, TarjetaRol } from "@/shared/ui/tarjeta";
import { datosInicioJugador } from "../../server/inicio";
import { TarjetaProximoPartido } from "./proximo-partido";

/**
 * Inicio del jugador · Para ti (pantalla 03 · export 03 claro): su próximo partido, sus números del torneo,
 * rachas, la cuota del equipo, el "aguas" de amarillas y el goleo. Solo datos reales (regla 9) y de cédulas
 * VALIDADAS (regla 2). Solo lectura.
 */
export async function InicioJugador({
  userId,
  slugEquipo,
  ahora,
  persona,
}: {
  userId: string;
  slugEquipo: string;
  ahora: Date;
  persona: { nombre: string; sobrenombre?: string | null; username: string };
}) {
  const d = await datosInicioJugador(userId, slugEquipo, ahora);
  if (!d) return null;
  const nombre = nombreVisible(persona);
  return (
    <main className="flex flex-col gap-3 px-4 pt-3.5 pb-6">
      {d.proximo ? (
        <TarjetaProximoPartido p={d.proximo} />
      ) : (
        <TarjetaRol className="flex flex-col gap-1">
          <Sobretitulo>{d.equipo.nombre}</Sobretitulo>
          <h1 className="titular-momento text-[34px]">Sin partido programado</h1>
          <p className="text-[13px] text-white/80">Cuando la liga publique la jornada, aquí sale tu próximo partido.</p>
        </TarjetaRol>
      )}

      {d.stats && (
        <Tarjeta className="flex items-center gap-3 p-3">
          {/* Su cara de frente; la carta completa (media y atributos) está en /j/[username]/carta */}
          <Link
            href={`/j/${persona.username}/carta`}
            aria-label="Ver mi carta"
            className="tarjeta-rol relative h-28 w-[84px] shrink-0 overflow-hidden rounded-[10px] text-white"
          >
            <span className="font-display absolute top-1.5 left-2 text-[13px] leading-none font-black text-brand-lime">
              {d.posicion ?? ""}
              {d.dorsal != null && <span className="block text-[22px]">#{d.dorsal}</span>}
            </span>
            <Iniciales
              nombre={nombre}
              tamano={36}
              className="absolute top-2 right-2 border-2 border-brand-lime bg-brand-silver text-brand-blue"
            />
            <span className="titular-momento absolute bottom-2 left-2 right-1 text-[17px] leading-[0.86]">{nombre}</span>
          </Link>
          <dl className="grid flex-1 grid-cols-3 gap-1 text-center">
            {(
              [
                ["Goles", d.stats.goles, true],
                ["Partidos", d.stats.partidos, false],
                ["Asist.", d.stats.asistencias, false],
              ] as const
            ).map(([etiqueta, valor, acento]) => (
              <div key={etiqueta} className="flex flex-col-reverse">
                <dt className="etiqueta text-[10px] tracking-[0.14em] text-muted-foreground">{etiqueta}</dt>
                <dd className={cn("font-display text-[38px] leading-[0.9] font-black", acento && "text-role")}>{valor}</dd>
              </div>
            ))}
          </dl>
        </Tarjeta>
      )}

      {d.chips.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Tus rachas">
          {d.chips.map((c) => (
            <li
              key={c}
              className="etiqueta inline-flex h-[30px] items-center rounded-full bg-brand-lime px-3 text-xs font-extrabold tracking-[0.12em] whitespace-nowrap text-ink"
            >
              {c}
            </li>
          ))}
        </ul>
      )}

      {d.cuota && (
        <Tarjeta className="flex items-center gap-2.5 py-3 pr-3 pl-3.5">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2">
              <b className="text-[15px]">{d.cuota.concepto}</b>
              <Chip tono={d.cuota.enRevision ? "neutro" : "ambar"}>{d.cuota.enRevision ? "En revisión" : "Pendiente"}</Chip>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatMXN(d.cuota.amountCents)} · {d.cuota.enRevision ? "tu delegado lo está confirmando" : d.cuota.vence}
            </p>
          </div>
          {!d.cuota.enRevision && (
            <AccionPronto className={buttonVariants({ variant: "lima", size: "cta", className: "h-[38px] px-4 text-[13px]" })}>
              Pagar
            </AccionPronto>
          )}
        </Tarjeta>
      )}

      {d.suspension && (
        <p className="flex items-center gap-2.5 rounded-2xl bg-danger/12 p-3 text-[13px]">
          <span aria-hidden className="h-6 w-[18px] shrink-0 rounded-[3px] bg-danger" />
          <span>
            <b className="text-danger">
              Estás suspendido: {d.suspension.faltan === 1 ? "te falta 1 partido" : `te faltan ${d.suspension.faltan} partidos`}.
            </b>{" "}
            {d.suspension.motivo}.
          </span>
        </p>
      )}

      {d.alerta && <AvisoAmarillas texto={d.alerta} />}

      {d.goleo.length > 0 && d.torneo && (
        <Tarjeta className="flex flex-col gap-1 p-3.5">
          <Sobretitulo className="text-muted-foreground">Goleo · {d.torneo.nombre}</Sobretitulo>
          <ol className="mt-1 flex flex-col gap-1">
            {d.goleo.map((g) => (
              <li key={g.userId}>
                <Link
                  href={`/j/${g.username}`}
                  className={cn("flex min-h-11 items-center gap-3 rounded-lg px-2", g.userId === d.yo && "bg-role/10")}
                >
                <span className="font-display w-4 text-[18px] font-black">{g.posicion}</span>
                <Iniciales nombre={g.nombre} tamano={30} />
                <span className="flex-1 text-sm font-semibold">
                  {g.nombre}
                  {g.userId === d.yo ? " · tú" : ""}
                </span>
                <span className={cn("font-display text-[22px] font-black", g.userId === d.yo && "text-role")}>{g.goles}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Tarjeta>
      )}
    </main>
  );
}

/** "Aguas: llevas 4 amarillas. Una más y te sientas un partido." (PRD §7.6, ámbar) */
function AvisoAmarillas({ texto }: { texto: string }) {
  const corte = texto.indexOf(". ") + 1;
  return (
    <p className="flex items-center gap-2.5 rounded-2xl bg-warning-soft p-3 text-[13px]">
      <span aria-hidden className="h-6 w-[18px] shrink-0 rounded-[3px] bg-amarilla" />
      <span>
        <b className="text-warning">{texto.slice(0, corte)}</b>
        {texto.slice(corte)}
      </span>
    </p>
  );
}
