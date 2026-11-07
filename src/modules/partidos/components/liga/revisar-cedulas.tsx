import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { nombreCorto } from "@/shared/lib/personas";
import { cn } from "@/shared/lib/utils";
import { Chip, type TonoChip } from "@/shared/ui/chip";
import { coloresDe, Escudo } from "@/shared/ui/escudo";
import { Sobretitulo, Tarjeta } from "@/shared/ui/tarjeta";
import { vistaDeLaCedula } from "../../server/cedula";
import { cedulasParaLaLiga } from "../../server/queries";
import { HORAS_PARA_VALIDAR_SIN_FIRMAS, laLigaPuedeContestar, transicion, type EstadoDeLaCedula, type EstadoDelPartido } from "../../server/services/estado-partido";
import { horarioCorto } from "../../server/services/proximo";
import { FilaDeLaCedula, Firmas, MarcadorCedula } from "../cedula/piezas";
import { BotonesRespuesta } from "../cedula/responder-correccion";
import { BotonValidar, BotonValidarListas } from "./botones-validar";

type Cedula = Awaited<ReturnType<typeof cedulasParaLaLiga>>[number];

/** Cómo va cada cédula (pantalla 46): LISTA · CORRECCIÓN PEDIDA · FALTA 1 FIRMA · POR FIRMAR */
function avance(c: Cedula): { chip: string; tono: TonoChip; detalle: string } {
  const r = c.report!;
  if (r.status === "FIRMADA") return { chip: "Lista", tono: "verde", detalle: "2 firmas · sin correcciones" };
  if (r.status === "EN_CORRECCION")
    return { chip: "Corrección pedida", tono: "rojo", detalle: `${r._count.corrections} sin contestar` };
  const falta = [!r.homeSignedAt ? c.homeTeam : null, !r.awaySignedAt ? c.awayTeam : null].filter((t) => t != null);
  if (falta.length === 1) return { chip: "Falta 1 firma", tono: "ambar", detalle: `${nombreCorto(falta[0].nombre)} no ha firmado` };
  return { chip: "Por firmar", tono: "ambar", detalle: "Ningún delegado ha firmado" };
}

/**
 * Revisar cédulas (pantalla 46 · PRD §7.7): lo que espera a la liga con su detalle y "Validar resultado".
 * Nada cuenta hasta que la liga valida (regla 2).
 */
export async function RevisarCedulas({
  slugLiga,
  torneo,
  seleccion,
  puedeValidar,
  ahora,
}: {
  slugLiga: string;
  torneo: { id: string; nombre: string };
  seleccion?: string;
  puedeValidar: boolean;
  ahora: Date;
}) {
  const cedulas = await cedulasParaLaLiga(torneo.id);
  const elegida = cedulas.find((c) => c.id === seleccion) ?? cedulas[0];
  const listas = cedulas.filter((c) => c.report?.status === "FIRMADA").length;
  const jornada = cedulas[0]?.round?.numero;
  return (
    <main className="flex flex-col gap-4 px-4 pt-3.5 pb-8 lg:max-w-6xl">
      <div className="flex flex-col gap-1">
        <Sobretitulo className="text-role">Panel de la liga · {torneo.nombre}</Sobretitulo>
        <h1 className="titular-momento text-[40px] leading-[0.9]">Revisar cédulas</h1>
        <p className="text-[13px] text-muted-foreground">Lo que capturó el árbitro, las firmas y las correcciones · nada cuenta hasta que la liga valida</p>
      </div>

      {!cedulas.length ? (
        <Tarjeta className="p-4 text-sm text-muted-foreground">No hay cédulas por revisar. Todo al corriente.</Tarjeta>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <section aria-label="Cédulas por validar" className="flex flex-col gap-2">
            <Sobretitulo className="text-muted-foreground">
              {jornada ? `J${jornada} · ` : ""}Por validar · {cedulas.length}
            </Sobretitulo>
            <ul className="flex flex-col gap-2">
              {cedulas.map((c) => {
                const a = avance(c);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/admin/${slugLiga}/cedulas?partido=${c.id}`}
                      scroll={false}
                      aria-current={c.id === elegida?.id ? "true" : undefined}
                      className={cn("flex flex-col gap-1.5 rounded-2xl border border-border bg-surface p-3", c.id === elegida?.id && "border-role")}
                    >
                      <span className="flex items-center gap-2">
                        <Escudo {...coloresDe(c.homeTeam)} tamano={18} conSiglas={false} />
                        <span className="font-display flex-1 truncate text-[17px] font-black uppercase italic">
                          {nombreCorto(c.homeTeam.nombre)} <span className="text-role">{c.report?.homeScore ?? 0}–{c.report?.awayScore ?? 0}</span> {nombreCorto(c.awayTeam.nombre)}
                        </span>
                        <Escudo {...coloresDe(c.awayTeam)} tamano={18} conSiglas={false} />
                      </span>
                      <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <Chip tono={a.tono}>{a.chip}</Chip>
                        {a.detalle}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {puedeValidar && listas > 0 && <BotonValidarListas tournamentId={torneo.id} listas={listas} />}
          </section>
          {elegida && <Detalle matchId={elegida.id} puedeValidar={puedeValidar} ahora={ahora} />}
        </div>
      )}
    </main>
  );
}

async function Detalle({ matchId, puedeValidar, ahora }: { matchId: string; puedeValidar: boolean; ahora: Date }) {
  const v = await vistaDeLaCedula(matchId);
  if (!v?.cedula) return null;
  const enviada = v.cedula.enviadaEn;
  const horas = enviada ? (ahora.getTime() - enviada.getTime()) / 3_600_000 : 0;
  const t = transicion(
    {
      partido: v.partido as EstadoDelPartido,
      cedula: v.cedula.estado as EstadoDeLaCedula,
      firmas: { local: v.cedula.firmas.local != null, visita: v.cedula.firmas.visita != null },
    },
    { tipo: "VALIDAR", horasDesdeEnvio: horas },
  );
  const pendientes = v.correcciones.filter((c) => c.estado === "PENDIENTE");
  return (
    <section aria-label="Detalle de la cédula" className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3.5">
      <Sobretitulo className="text-muted-foreground">
        {[v.jornada ? `J${v.jornada}` : null, v.horario, `Capturó ${v.arbitro}`].filter(Boolean).join(" · ")}
      </Sobretitulo>
      <MarcadorCedula v={v} />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="flex flex-col">
          <Sobretitulo className="text-muted-foreground">Lo que capturó el árbitro</Sobretitulo>
          <ul className="flex flex-col divide-y divide-border">
            {v.eventos.map((e) => (
              <FilaDeLaCedula key={e.id} e={e} v={v} />
            ))}
            {!v.eventos.length && <li className="py-2 text-sm text-muted-foreground">Sin goles ni tarjetas.</li>}
          </ul>
          <p className="mt-2 text-[12px] text-muted-foreground">
            Jugaron {v.jugaron[v.local.teamId]?.length ?? 0} de {v.local.corto} y {v.jugaron[v.visita.teamId]?.length ?? 0} de {v.visita.corto}
            {v.cedula.observaciones ? ` · ${v.cedula.observaciones}` : " · sin observaciones"}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Sobretitulo className="text-muted-foreground">Firmas</Sobretitulo>
          <Firmas v={v} />
          {v.correcciones.length > 0 && (
            <>
              <Sobretitulo className="text-muted-foreground">Correcciones</Sobretitulo>
              <ul className="flex flex-col gap-2">
                {v.correcciones.map((c, i) => {
                  // Si el árbitro no la contesta en 48 h, la contesta la liga (POR APROBAR)
                  const vencida = c.estado === "PENDIENTE" && laLigaPuedeContestar(c.creadaEn, ahora);
                  return (
                    <li key={c.id} className="flex flex-col gap-2 rounded-xl border border-border p-2.5 text-[13px]">
                      <span className="flex items-center justify-between gap-2">
                        <strong>
                          {i + 1} · {c.quien} ({c.equipo})
                        </strong>
                        <Chip tono={c.estado === "PENDIENTE" ? "ambar" : c.estado === "ACEPTADA" ? "verde" : "rojo"}>
                          {c.estado === "PENDIENTE" ? "Le toca al árbitro" : c.estado === "ACEPTADA" ? "Aceptada" : "Rechazada"}
                        </Chip>
                      </span>
                      <span>
                        {c.dice ? (
                          <>
                            {c.dice} <ArrowRight aria-hidden className="inline size-3" /> {c.debeDecir ?? "—"}
                          </>
                        ) : (
                          c.titulo
                        )}
                      </span>
                      {c.comentario && <span className="text-muted-foreground italic">“{c.comentario}”</span>}
                      {c.estado === "PENDIENTE" && puedeValidar && (vencida ? <BotonesRespuesta correctionId={c.id} /> : null)}
                    </li>
                  );
                })}
              </ul>
              {pendientes.some((c) => !laLigaPuedeContestar(c.creadaEn, ahora)) && puedeValidar && (
                <p className="text-[12px] text-muted-foreground">
                  Si {v.arbitro} no contesta en {HORAS_PARA_VALIDAR_SIN_FIRMAS} h, la contestas tú.
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-border pt-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-[12px] text-muted-foreground">
          {t.ok
            ? "Al validar cuenta para tabla, goleo y cartas, y se avisa a los dos equipos."
            : enviada && v.cedula.estado === "ENVIADA"
              ? `Faltan firmas. Si no firman, la puedes validar desde el ${horarioCorto(new Date(enviada.getTime() + HORAS_PARA_VALIDAR_SIN_FIRMAS * 3_600_000))}.`
              : t.motivo}
        </p>
        {puedeValidar ? (
          <BotonValidar matchId={v.matchId} listo={t.ok} />
        ) : (
          <p className="text-[12px] text-muted-foreground">Valida el dueño o un administrador de la liga.</p>
        )}
      </div>
    </section>
  );
}
