import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Chip } from "@/shared/ui/chip";
import { Sobretitulo, Tarjeta } from "@/shared/ui/tarjeta";
import type { VistaDeLaCedula } from "../../server/cedula";
import { ESTADO_CEDULA, FilaDeLaCedula, Firmas, MarcadorCedula } from "./piezas";
import { BotonesRespuesta } from "./responder-correccion";

const TEXTO: Record<string, string> = {
  ENVIADA: "Les llegó a los delegados para firmar en su celular.",
  EN_CORRECCION: "Te piden corregir: contesta para que puedan firmar.",
  FIRMADA: "Firmaron los dos. Ya la tiene la liga para validar.",
  VALIDADA: "La liga la validó: ya cuenta para la tabla y el goleo.",
};

/** Lo que ve el árbitro después de mandar la cédula (pantallas 02 y 19): firmas y correcciones por contestar */
export function CedulaEnviada({ v, volver }: { v: VistaDeLaCedula; volver: string }) {
  const estado = v.cedula?.estado ?? "BORRADOR";
  const pendientes = v.correcciones.filter((c) => c.estado === "PENDIENTE");
  const contestadas = v.correcciones.filter((c) => c.estado !== "PENDIENTE");
  return (
    <div className="flex min-h-dvh flex-col bg-background" data-role="arbitro">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background px-4 py-2">
        <Link href={volver} aria-label="Volver a mis partidos" className="-ml-2 flex size-11 items-center justify-center">
          <ArrowLeft aria-hidden className="size-5" />
        </Link>
        <span className="etiqueta flex-1 text-[13px] tracking-[0.14em]">
          Cédula{v.jornada ? ` J${v.jornada}` : ""} · {v.local.siglas} vs {v.visita.siglas}
        </span>
        <Chip tono={ESTADO_CEDULA[estado].tono}>{ESTADO_CEDULA[estado].chip}</Chip>
      </header>
      <main className="flex flex-col gap-4 px-4 pt-3 pb-10">
        {v.horario && <Sobretitulo className="text-muted-foreground">{v.horario}</Sobretitulo>}
        <MarcadorCedula v={v} />
        <p className="text-[14px] text-muted-foreground">{TEXTO[estado]}</p>
        <Firmas v={v} />

        {pendientes.map((c) => (
          <section key={c.id} aria-label="Te piden corregir" className="flex flex-col gap-3 rounded-2xl border border-role bg-surface p-3.5">
            <Sobretitulo className="text-role">Te piden corregir</Sobretitulo>
            <p className="text-[13px]">
              <strong>{c.quien}</strong> ({c.equipo}) señaló {c.dice ? `"${c.dice}"` : "que falta un evento"}.
            </p>
            <h2 className="titular-momento text-[30px] leading-[0.92]">{c.titulo}</h2>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="flex min-h-16 flex-col justify-center rounded-xl bg-danger/12 p-2.5 text-center">
                <span className="etiqueta text-[10px] tracking-[0.14em] text-danger">Dice</span>
                <span className="text-[13px] font-semibold line-through">{c.dice ?? "—"}</span>
              </div>
              <ArrowRight aria-hidden className="size-4 text-role" />
              <div className="flex min-h-16 flex-col justify-center rounded-xl bg-success-soft p-2.5 text-center">
                <span className="etiqueta text-[10px] tracking-[0.14em] text-success">Debe decir</span>
                <span className="text-[13px] font-semibold">{c.debeDecir ?? "—"}</span>
              </div>
            </div>
            {c.comentario && <p className="rounded-xl bg-surface-2 p-2.5 text-[13px] italic">“{c.comentario}”</p>}
            <BotonesRespuesta correctionId={c.id} />
            <p className="text-[12px] text-muted-foreground">Si aceptas, la cédula cambia y los delegados vuelven a firmar.</p>
          </section>
        ))}

        <Tarjeta className="flex flex-col p-3.5">
          <Sobretitulo className="text-muted-foreground">Lo que capturaste · {v.eventos.length} eventos</Sobretitulo>
          <ul className="flex flex-col divide-y divide-border">
            {v.eventos.map((e) => (
              <FilaDeLaCedula key={e.id} e={e} v={v} />
            ))}
            {!v.eventos.length && <li className="py-2 text-sm text-muted-foreground">Sin goles ni tarjetas.</li>}
          </ul>
          {v.cedula?.observaciones && <p className="mt-2 text-[13px] text-muted-foreground">Notas: {v.cedula.observaciones}</p>}
        </Tarjeta>

        {contestadas.length > 0 && (
          <Tarjeta className="flex flex-col gap-1.5 p-3.5 text-[13px]">
            <Sobretitulo className="text-muted-foreground">Correcciones contestadas</Sobretitulo>
            {contestadas.map((c) => (
              <p key={c.id}>
                {c.estado === "ACEPTADA" ? "✓ Aceptaste" : "✕ Rechazaste"} lo que señaló {c.quien}: {c.titulo.toLowerCase()}
                {c.comentario ? ` (“${c.comentario}”)` : ""}
              </p>
            ))}
          </Tarjeta>
        )}
      </main>
    </div>
  );
}
