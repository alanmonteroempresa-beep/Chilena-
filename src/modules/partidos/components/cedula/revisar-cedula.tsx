"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowRight, Flag, Plus, Signature } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { BotonLima, Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { Escudo } from "@/shared/ui/escudo";
import { Sobretitulo, Tarjeta } from "@/shared/ui/tarjeta";
import type { VistaDeLaCedula } from "../../server/cedula";
import { firmarCedula, pedirCorreccion } from "../../server/actions";
import { aplicarCorreccion, textoDelEvento, TIPOS_CAPTURADOS, TIPOS_DE_GOL, type Propuesta, type TipoCapturado, type TipoDeCorreccion, type TipoDeGol } from "../../server/services/cedula";
import { ESTADO_CEDULA, FilaDeLaCedula, Firmas, MarcadorCedula } from "./piezas";
import { CHIP_TIPO_GOL } from "./tipos";

const KINDS: { kind: TipoDeCorreccion; etiqueta: string }[] = [
  { kind: "JUGADOR_EQUIVOCADO", etiqueta: "Jugador equivocado" },
  { kind: "MINUTO", etiqueta: "Minuto" },
  { kind: "TIPO_EVENTO", etiqueta: "Tipo de evento" },
  { kind: "SOBRA_EVENTO", etiqueta: "No pasó" },
];
const TIPO: Record<TipoCapturado, string> = { GOL: "Gol", AUTOGOL: "Autogol", AMARILLA: "Amarilla", ROJA: "Roja" };

/**
 * El delegado revisa la cédula antes de firmar (pantalla 19 · PRD §7.7): toca un evento para señalarlo
 * (jugador, minuto, tipo, no pasó o falta uno) o firma sin cambios. Mientras haya una corrección, la cédula
 * queda en pausa.
 */
export function RevisarCedula({ v, teamId }: { v: VistaDeLaCedula; teamId: string }) {
  const [pendiente, startTransition] = useTransition();
  const [senalado, setSenalado] = useState<string | "FALTA" | null>(null);
  const lado = teamId === v.local.teamId ? "local" : "visita";
  const estado = v.cedula?.estado ?? "BORRADOR";
  const yaFirme = v.cedula?.firmas[lado] != null;
  const enPausa = estado === "EN_CORRECCION";
  const abierta = (estado === "ENVIADA" || enPausa) && v.partido === "POR_FIRMAR";
  const puedoSenalar = abierta && !yaFirme;
  const nombres = useMemo(
    () => Object.fromEntries([...Object.values(v.jugaron).flat().map((j) => [j.userId, j.nombre]), ...v.eventos.map((e) => [e.jugadorId, e.nombre])]),
    [v],
  );

  function firmar() {
    startTransition(async () => {
      const r = await firmarCedula({ matchId: v.matchId, teamId });
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.estado === "FINALIZADO" ? "Firmaste. Ya firmaron los dos: la cédula se va a la liga." : "Firmaste. Falta la firma del otro equipo.");
    });
  }

  return (
    <main className="flex flex-col gap-4 px-4 pt-3.5 pb-8">
      <div className="flex flex-col gap-1">
        <Sobretitulo className="text-role">
          Cédula{v.jornada ? ` J${v.jornada}` : ""} · árbitro {v.arbitro}
        </Sobretitulo>
        <div className="flex items-start justify-between gap-2">
          <h1 className="titular-momento text-[38px] leading-[0.9]">{puedoSenalar ? "Revisa antes de firmar" : "La cédula"}</h1>
          <Chip tono={ESTADO_CEDULA[estado].tono}>{ESTADO_CEDULA[estado].chip}</Chip>
        </div>
      </div>
      <MarcadorCedula v={v} />
      <Firmas v={v} />
      {enPausa && (
        <p className="rounded-xl border border-danger/40 bg-danger/12 p-3 text-[13px]">
          La cédula queda en pausa hasta que {v.arbitro} conteste la corrección. Te avisamos en la campana.
        </p>
      )}

      <Tarjeta className="flex flex-col p-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <Sobretitulo className="text-muted-foreground">Lo que capturó el árbitro</Sobretitulo>
          <span className="text-[11px] text-muted-foreground">
            {v.eventos.length} eventos{puedoSenalar ? " · toca uno para señalarlo" : ""}
          </span>
        </div>
        <ul className="flex flex-col divide-y divide-border">
          {v.eventos.map((e) => {
            const señalada = v.correcciones.some((c) => c.estado === "PENDIENTE" && c.eventoId === e.id);
            return (
              <FilaDeLaCedula key={e.id} e={e} v={v} tachado={señalada}>
                {señalada ? (
                  <Chip tono="rojo">Error</Chip>
                ) : (
                  puedoSenalar && (
                    <button type="button" onClick={() => setSenalado(senalado === e.id ? null : e.id)} className="-mr-1 min-h-11 px-2 text-[12px] font-bold text-role">
                      Señalar
                    </button>
                  )
                )}
              </FilaDeLaCedula>
            );
          })}
          {!v.eventos.length && <li className="py-2 text-sm text-muted-foreground">Sin goles ni tarjetas.</li>}
        </ul>
        {puedoSenalar && (
          <button type="button" onClick={() => setSenalado(senalado === "FALTA" ? null : "FALTA")} className="mt-1 flex min-h-11 items-center gap-1.5 text-[13px] font-bold text-role">
            <Plus aria-hidden className="size-4" />
            Falta un evento
          </button>
        )}
      </Tarjeta>

      {senalado && (
        <Senalar
          key={senalado}
          v={v}
          teamId={teamId}
          eventoId={senalado === "FALTA" ? null : senalado}
          nombres={nombres}
          onListo={() => setSenalado(null)}
        />
      )}

      <details className="rounded-2xl border border-border bg-surface p-3.5 text-[13px]">
        <summary className="min-h-8 cursor-pointer font-semibold">
          Jugaron · {v.local.corto} {v.jugaron[v.local.teamId]?.length ?? 0} · {v.visita.corto} {v.jugaron[v.visita.teamId]?.length ?? 0}
        </summary>
        {[v.local, v.visita].map((e) => (
          <p key={e.teamId} className="mt-2">
            <strong>{e.corto}:</strong> {(v.jugaron[e.teamId] ?? []).map((j) => `${j.numero ?? ""} ${j.nombre}`.trim()).join(", ") || "—"}
          </p>
        ))}
        {v.cedula?.observaciones && <p className="mt-2 text-muted-foreground">Notas del árbitro: {v.cedula.observaciones}</p>}
      </details>

      {v.correcciones.length > 0 && (
        <Tarjeta className="flex flex-col gap-1.5 p-3.5 text-[13px]">
          <Sobretitulo className="text-muted-foreground">Correcciones</Sobretitulo>
          {v.correcciones.map((c) => (
            <p key={c.id}>
              <Chip tono={c.estado === "PENDIENTE" ? "ambar" : c.estado === "ACEPTADA" ? "verde" : "rojo"}>
                {c.estado === "PENDIENTE" ? "Esperando" : c.estado === "ACEPTADA" ? "Aceptada" : "Rechazada"}
              </Chip>{" "}
              {c.quien}: {c.dice ? `${c.dice}${c.debeDecir ? ` → ${c.debeDecir}` : ""}` : c.titulo.toLowerCase()}
            </p>
          ))}
        </Tarjeta>
      )}

      {abierta && !yaFirme && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] text-muted-foreground">Si todo está bien:</span>
          <BotonLima className="w-full" disabled={pendiente || enPausa} onClick={firmar}>
            <Signature aria-hidden />
            {enPausa ? "En pausa: espera al árbitro" : "Firmar sin cambios"}
          </BotonLima>
        </div>
      )}
      {yaFirme && estado !== "VALIDADA" && (
        <p className="text-[13px] text-success">{estado === "FIRMADA" ? "Firmaron los dos. Ahora la valida la liga." : "Ya firmaste ✓. Falta el otro equipo."}</p>
      )}
    </main>
  );
}

function Senalar({ v, teamId, eventoId, nombres, onListo }: { v: VistaDeLaCedula; teamId: string; eventoId: string | null; nombres: Record<string, string>; onListo: () => void }) {
  const evento = v.eventos.find((e) => e.id === eventoId) ?? null;
  const [kind, setKind] = useState<TipoDeCorreccion>(evento ? "JUGADOR_EQUIVOCADO" : "FALTA_EVENTO");
  const [equipoId, setEquipoId] = useState(evento?.equipoId ?? teamId);
  const [jugadorId, setJugadorId] = useState<string | null>(null);
  const [minuto, setMinuto] = useState(evento?.minuto != null ? String(evento.minuto) : "");
  const [tipo, setTipo] = useState<TipoCapturado>(evento?.tipo ?? "GOL");
  const [tipoGol, setTipoGol] = useState<TipoDeGol | null>(evento?.tipoGol ?? "JUGADA");
  const [comentario, setComentario] = useState("");
  const [pendiente, startTransition] = useTransition();

  const propuesta: Propuesta =
    kind === "JUGADOR_EQUIVOCADO"
      ? { jugadorId: jugadorId ?? undefined, equipoId }
      : kind === "MINUTO"
        ? { minuto: minuto === "" ? null : Number(minuto) }
        : kind === "TIPO_EVENTO"
          ? { tipo, tipoGol: tipo === "GOL" ? tipoGol : null }
          : kind === "FALTA_EVENTO"
            ? { tipo, jugadorId: jugadorId ?? undefined, equipoId, minuto: minuto === "" ? null : Number(minuto), tipoGol: tipo === "GOL" ? tipoGol : null }
            : {};
  const listo = kind === "JUGADOR_EQUIVOCADO" || kind === "FALTA_EVENTO" ? !!jugadorId : true;
  let debeDecir: string | null = null;
  if (listo) {
    try {
      const nuevos = aplicarCorreccion(v.eventos, { kind, eventoId, propuesta }, "nuevo");
      const cambiado = nuevos.find((e) => e.id === (kind === "FALTA_EVENTO" ? "nuevo" : eventoId));
      debeDecir = kind === "SOBRA_EVENTO" ? "No pasó" : cambiado ? textoDelEvento(cambiado, nombres) : null;
    } catch {
      debeDecir = null;
    }
  }
  const equipo = equipoId === v.local.teamId ? v.local : v.visita;
  const jugaron = v.jugaron[equipoId] ?? [];

  function mandar() {
    startTransition(async () => {
      const r = await pedirCorreccion({ matchId: v.matchId, teamId, kind, eventoId, propuesta, comentario });
      if (!r.ok) return void toast.error(r.error);
      toast.success(`Corrección enviada a ${v.arbitro}. La cédula queda en pausa.`);
      onListo();
    });
  }

  return (
    <section aria-label="Señalar un error" className="flex flex-col gap-3 rounded-2xl border border-role bg-surface p-3.5">
      <Sobretitulo className="text-role">
        {evento ? `Señalaste: ${textoDelEvento(evento, nombres)}` : "Falta un evento en la cédula"}
      </Sobretitulo>
      {evento && (
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              aria-pressed={kind === k.kind}
              onClick={() => setKind(k.kind)}
              className={cn("min-h-10 rounded-full border border-border px-3 text-[12px] font-semibold", kind === k.kind && "border-transparent bg-foreground text-background")}
            >
              {k.etiqueta}
            </button>
          ))}
        </div>
      )}

      {(kind === "TIPO_EVENTO" || kind === "FALTA_EVENTO") && (
        <div className="flex flex-wrap gap-1.5">
          {TIPOS_CAPTURADOS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tipo === t}
              onClick={() => setTipo(t)}
              className={cn("etiqueta min-h-10 rounded-full border border-border px-3 text-[11px]", tipo === t && "border-transparent bg-brand-lime text-ink")}
            >
              {TIPO[t]}
            </button>
          ))}
        </div>
      )}
      {(kind === "TIPO_EVENTO" || kind === "FALTA_EVENTO") && tipo === "GOL" && (
        <div className="flex flex-wrap gap-1.5">
          {TIPOS_DE_GOL.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tipoGol === t}
              onClick={() => setTipoGol(t)}
              className={cn("etiqueta min-h-9 rounded-full border border-border px-2.5 text-[10px]", tipoGol === t && "border-transparent bg-foreground text-background")}
            >
              {CHIP_TIPO_GOL[t]}
            </button>
          ))}
        </div>
      )}

      {(kind === "JUGADOR_EQUIVOCADO" || kind === "FALTA_EVENTO") && (
        <>
          <div role="radiogroup" aria-label="Equipo" className="grid grid-cols-2 gap-1.5 rounded-xl bg-surface-2 p-1">
            {[v.local, v.visita].map((e) => (
              <button
                key={e.teamId}
                type="button"
                role="radio"
                aria-checked={equipoId === e.teamId}
                onClick={() => {
                  setEquipoId(e.teamId);
                  setJugadorId(null);
                }}
                className={cn("flex min-h-11 items-center justify-center gap-2 rounded-lg text-[12px] font-bold uppercase", equipoId === e.teamId && "bg-background")}
              >
                <Escudo {...e.colores} tamano={16} conSiglas={false} />
                {e.corto}
              </button>
            ))}
          </div>
          <p className="titular-momento text-[24px]">¿Quién fue de {equipo.corto}?</p>
          <div className="grid grid-cols-3 gap-1.5">
            {jugaron.map((j) => (
              <button
                key={j.userId}
                type="button"
                aria-pressed={jugadorId === j.userId}
                onClick={() => setJugadorId(j.userId)}
                className={cn("flex min-h-12 items-center gap-1.5 rounded-xl border border-border px-2 text-left text-[12px] font-semibold", jugadorId === j.userId && "border-transparent bg-brand-lime text-ink")}
              >
                <span className="font-display text-[18px] font-black">{j.numero ?? "–"}</span>
                <span className="truncate">{j.nombre}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {(kind === "MINUTO" || kind === "FALTA_EVENTO") && (
        <label className="flex items-center gap-2 text-[13px]">
          Minuto
          <input
            inputMode="numeric"
            maxLength={3}
            value={minuto}
            onChange={(e) => setMinuto(e.target.value.replace(/\D/g, ""))}
            className="h-11 w-20 rounded-lg border border-border bg-background px-2 text-center font-display text-[18px] font-black"
            aria-label="Minuto"
          />
        </label>
      )}

      {(evento || debeDecir) && (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex min-h-16 flex-col justify-center rounded-xl bg-danger/12 p-2.5 text-center">
            <span className="etiqueta text-[10px] tracking-[0.14em] text-danger">Dice</span>
            <span className="text-[13px] font-semibold line-through">{evento ? textoDelEvento(evento, nombres) : "Nada"}</span>
          </div>
          <ArrowRight aria-hidden className="size-4 text-role" />
          <div className="flex min-h-16 flex-col justify-center rounded-xl bg-success-soft p-2.5 text-center">
            <span className="etiqueta text-[10px] tracking-[0.14em] text-success">Debe decir</span>
            <span className="text-[13px] font-semibold">{debeDecir ?? "Elige…"}</span>
          </div>
        </div>
      )}

      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value.slice(0, 500))}
        rows={3}
        aria-label="Comentario para el árbitro"
        placeholder="Fue penal y lo cobró El Chícharo a lo Panenka. Todos lo vimos, profe."
        className="rounded-xl border border-border bg-background p-2.5 text-[14px]"
      />
      <BotonLima className="w-full" disabled={!listo || pendiente} onClick={mandar}>
        <Flag aria-hidden />
        Mandar corrección al árbitro
      </BotonLima>
      <Button variant="quieto" size="cta" className="w-full" onClick={onListo}>
        Cancelar
      </Button>
      <p className="text-[12px] text-muted-foreground">La cédula queda en pausa hasta que {v.arbitro} responda. Te avisamos en la campana.</p>
    </section>
  );
}
