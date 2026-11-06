import Link from "next/link";
import { MessageCircle, Send, UserPlus } from "lucide-react";
import { formatMXN } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { AccionPronto } from "@/shared/ui/accion-pronto";
import { buttonVariants } from "@/shared/ui/button";
import { Chip, type TonoChip } from "@/shared/ui/chip";
import { Iniciales } from "@/shared/ui/iniciales";
import { Sobretitulo, Tarjeta, TarjetaRol, TituloSeccion } from "@/shared/ui/tarjeta";
import { datosInicioDelegado } from "../server/inicio";
import type { EstadoEnPlantilla, Respuesta } from "../server/services/plantilla";

type Datos = NonNullable<Awaited<ReturnType<typeof datosInicioDelegado>>>;

const CHIP_ESTADO: Record<EstadoEnPlantilla, { tono: TonoChip; texto: string }> = {
  SUSPENDIDO: { tono: "rojo", texto: "Suspendido" },
  CUOTA_PENDIENTE: { tono: "ambar", texto: "Cuota pendiente" },
  EN_REVISION: { tono: "neutro", texto: "En revisión" },
  HABILITADO: { tono: "verde", texto: "Habilitado" },
};
const RESPUESTA: Record<Respuesta, { texto: string; clase: string }> = {
  VA: { texto: "Va", clase: "text-success" },
  NO_VA: { texto: "No va", clase: "text-danger" },
  LESIONADO: { texto: "Lesionado", clase: "text-danger" },
  SIN_RESPUESTA: { texto: "Sin respuesta", clase: "text-warning" },
};

/**
 * Inicio del delegado = gestión del equipo (pantalla 04 · PRD §7.6 y §7.11): quién va el domingo, cuotas,
 * lo que se le debe a la liga y la plantilla "primero los que necesitan atención". Solo lectura.
 */
export async function InicioDelegado({ slugEquipo, ahora }: { slugEquipo: string; ahora: Date }) {
  const d = await datosInicioDelegado(slugEquipo, ahora);
  if (!d) return null;
  return (
    <main className="flex flex-col gap-3 px-4 pt-3.5 pb-6">
      {d.cedulaPorFirmar && (
        <Tarjeta className="flex items-center gap-3 border-warning/40 bg-warning-soft p-3.5">
          <div className="flex-1">
            <p className="text-sm font-bold">Cédula{d.cedulaPorFirmar.jornada ? ` J${d.cedulaPorFirmar.jornada}` : ""} · {d.cedulaPorFirmar.partido}</p>
            <p className="text-xs text-warning">Falta tu firma</p>
          </div>
          <AccionPronto className={buttonVariants({ variant: "lima", size: "cta", className: "h-10 px-4" })}>Firmar</AccionPronto>
        </Tarjeta>
      )}

      <PaseDeLista d={d} />

      <div className="grid grid-cols-2 gap-2.5">
        <Tarjeta className="flex flex-col gap-1 p-3.5">
          <Sobretitulo className="text-muted-foreground">Cuotas al corriente</Sobretitulo>
          {d.cuota ? (
            <>
              <span className="font-display text-[32px] leading-none font-black">
                {d.cuota.alCorriente}/{d.cuota.total}
              </span>
              <span className="text-xs text-muted-foreground">
                {d.cuota.deben > 0 ? `${d.cuota.deben} deben ${formatMXN(d.cuota.adeudoCents)}` : "Nadie debe"}
                {d.cuota.enRevision > 0 ? ` · ${d.cuota.enRevision} en revisión` : ""}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Sin cuotas este mes</span>
          )}
        </Tarjeta>
        <Tarjeta className="flex flex-col gap-1 p-3.5">
          <Sobretitulo className="text-muted-foreground">A la liga</Sobretitulo>
          <span className="font-display text-[32px] leading-none font-black">{formatMXN(d.aLaLiga.totalCents)}</span>
          {d.aLaLiga.totalCents > 0 ? (
            <>
              <span className="text-xs text-muted-foreground">{conceptos(d.aLaLiga.conceptos)}</span>
              {d.aLaLiga.vence && <span className="text-xs font-semibold text-warning">{d.aLaLiga.vence}</span>}
            </>
          ) : (
            <span className="text-xs font-semibold text-success">Al corriente</span>
          )}
        </Tarjeta>
      </div>

      <section className="flex flex-col gap-2" aria-labelledby="plantilla">
        <div className="flex items-end justify-between gap-2 pt-2">
          <TituloSeccion>
            <span id="plantilla">Plantilla</span>
          </TituloSeccion>
          <AccionPronto className="etiqueta inline-flex min-h-11 items-center gap-1 text-xs font-extrabold tracking-[0.12em] text-role">
            <UserPlus aria-hidden className="size-4" />
            Agregar jugador
          </AccionPronto>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          {d.jugadores.length} jugadores · primero los que necesitan atención
          {d.enAtencion > 0 ? ` · ${d.enAtencion} en atención` : ""}
        </p>
        <Tarjeta>
          <ul className="divide-y divide-border">
            {d.jugadores.map((j) => {
              const r = RESPUESTA[j.respuesta];
              const chip = CHIP_ESTADO[j.estado];
              const sub =
                j.faltanDeSuspension != null
                  ? `Suspendido · ${j.faltanDeSuspension === 1 ? "le falta 1 partido" : `le faltan ${j.faltanDeSuspension} partidos`}`
                  : [r.texto, j.nota].filter(Boolean).join(" · ");
              return (
                <li key={j.id}>
                  <Link href={`/j/${j.username}`} className="flex min-h-14 items-center gap-3 px-3.5 py-2">
                  <span className="font-display w-6 shrink-0 text-center text-[20px] leading-none font-black">{j.numero}</span>
                  <Iniciales nombre={j.nombre} tamano={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{j.nombre}</p>
                    <p className={cn("truncate text-xs", j.faltanDeSuspension != null ? "text-muted-foreground" : r.clase)}>{sub}</p>
                  </div>
                  <Chip tono={chip.tono}>{chip.texto}</Chip>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Tarjeta>
      </section>

      {d.pagosALaLiga.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="pagos-liga">
          <TituloSeccion className="pt-2">
            <span id="pagos-liga">Pagos a la liga</span>
          </TituloSeccion>
          <Tarjeta>
            <ul className="divide-y divide-border">
              {d.pagosALaLiga.map((c) => (
                <li key={c.id} className="flex min-h-14 items-center gap-3 px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.descripcion}</p>
                    {c.vence && c.status !== "CONFIRMADO" && <p className="text-xs text-muted-foreground">{c.vence}</p>}
                  </div>
                  <span className="font-display text-[20px] leading-none font-black">{formatMXN(c.amountCents)}</span>
                  <ChipPago status={c.status} vencido={c.vencido} />
                </li>
              ))}
            </ul>
          </Tarjeta>
        </section>
      )}
    </main>
  );
}

function PaseDeLista({ d }: { d: Datos }) {
  if (!d.proximo || !d.paseDeLista) {
    return (
      <TarjetaRol className="flex flex-col gap-1">
        <Sobretitulo className="text-white/80">{d.equipo.nombre}</Sobretitulo>
        <p className="titular-momento text-[34px]">Sin partido programado</p>
        <p className="text-[13px] text-white/80">Cuando la liga publique la jornada, aquí sale el pase de lista.</p>
      </TarjetaRol>
    );
  }
  const { van, total, sinContestar } = d.paseDeLista;
  const caras = d.vanAlPartido.slice(0, 6);
  return (
    <TarjetaRol className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Sobretitulo className="text-white/90">
          {d.proximo.jornada ? `J${d.proximo.jornada} · ` : ""}vs {d.proximo.rival}
        </Sobretitulo>
        <span className="text-xs text-white/75">{d.proximo.horario}</span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="titular-momento text-[58px] leading-[0.82]">
          <span className="text-brand-lime">{van}</span>/{total}
          <span className="sr-only"> van {d.proximo.cuando.toLowerCase()}</span>
        </p>
        <p aria-hidden className="etiqueta pb-1 text-right text-xs leading-tight font-extrabold tracking-[0.14em]">
          Van
          <br />
          {d.proximo.cuando}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center" aria-hidden>
          {caras.map((n, i) => (
            <Iniciales key={n + i} nombre={n} tamano={30} className="-mr-2 ring-2 ring-white/70" />
          ))}
          {van > caras.length && (
            <span className="etiqueta ml-1 inline-flex size-[30px] items-center justify-center rounded-full bg-white/18 text-[11px] font-extrabold">
              +{van - caras.length}
            </span>
          )}
        </div>
        {sinContestar > 0 && <span className="text-[13px] font-bold text-gold">{sinContestar} sin contestar</span>}
      </div>
      <div className="flex gap-2">
        <AccionPronto className={buttonVariants({ variant: "lima", size: "cta", className: "h-11 flex-1" })}>
          <Send aria-hidden />
          Recordatorio
        </AccionPronto>
        <AccionPronto className="etiqueta inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-extrabold tracking-[0.14em] text-white">
          <MessageCircle aria-hidden className="size-4" />
          WhatsApp
        </AccionPronto>
      </div>
    </TarjetaRol>
  );
}

function ChipPago({ status, vencido }: { status: string; vencido: boolean }) {
  if (status === "CONFIRMADO") return <Chip tono="verde">Pagado</Chip>;
  if (status === "CONDONADO") return <Chip>Condonado</Chip>;
  if (status === "REPORTADO") return <Chip>En revisión</Chip>;
  return vencido ? <Chip tono="rojo">Vencido</Chip> : <Chip tono="ambar">Pendiente</Chip>;
}

/** "Arbitraje J16 + multa" · "Arbitraje J15 + Arbitraje J16 + 1 más" */
function conceptos(lista: string[]): string {
  return lista.length <= 2 ? lista.join(" + ") : `${lista.slice(0, 2).join(" + ")} + ${lista.length - 2} más`;
}
