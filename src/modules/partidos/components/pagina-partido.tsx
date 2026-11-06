import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowLeftRight, ArrowUp, FileCheck2, Share2 } from "lucide-react";
import { formatCDMX } from "@/shared/lib/dates";
import { nombreCorto, nombreDeArbitro, nombreVisible } from "@/shared/lib/personas";
import { cn } from "@/shared/lib/utils";
import { AccionPronto } from "@/shared/ui/accion-pronto";
import { buttonVariants } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { ChipEstado, chipsDelMarcador } from "@/shared/ui/chip-marcador";
import { coloresDe, Escudo } from "@/shared/ui/escudo";
import { Sobretitulo, Tarjeta } from "@/shared/ui/tarjeta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { partidoCompleto } from "../server/queries";
import { horaCDMX, horarioCorto } from "../server/services/proximo";
import {
  alineacionConMarcas,
  esGolazo,
  ETIQUETA_TIPO_GOL,
  resumenDelPartido,
  type EventoCedula,
  type FilaAlineacion,
} from "../server/services/resumen-partido";

type Partido = NonNullable<Awaited<ReturnType<typeof partidoCompleto>>>;
type Persona = { id: string; nombre: string; apellidos: string | null; sobrenombre: string | null } | null;

const nombre = (p: Persona) => (p ? nombreVisible(p) : null);
/** Firmas como las dice la banda: "Memo Salas", "Chava Ríos" (el apodo de una palabra va con su apellido) */
const nombreDeFirma = (p: Persona) => {
  if (!p) return null;
  const apellido = p.apellidos?.trim().split(/\s+/)[0];
  const apodo = p.sobrenombre?.trim();
  if (apodo) return apodo.includes(" ") || !apellido ? apodo : `${apodo} ${apellido}`;
  return [p.nombre, apellido].filter(Boolean).join(" ");
};
const conMayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * La página del partido (pantalla 32a · `/partido/[id]`). FINAL lo firma la cédula: el marcador y todo lo
 * de adentro es OFICIAL solo si la liga la validó (reglas 1 y 2). Programado: hora, cancha y árbitro.
 */
export function PaginaPartido({ p }: { p: Partido }) {
  const validado = p.status === "VALIDADO";
  const arbitro = p.referee ? nombreDeArbitro(p.referee) : null;
  const eventos: EventoCedula[] = p.events.map((e) => ({
    minuto: e.minute,
    tipo: e.type,
    equipoId: e.teamId,
    jugador: nombre(e.player),
    jugadorId: e.player?.id ?? null,
    asistencia: nombre(e.assistPlayer),
    sale: nombre(e.playerOut),
    saleId: e.playerOut?.id ?? null,
    tipoGol: e.tipoGol,
    nota: e.nota,
  }));
  const resumen = resumenDelPartido(eventos, p.homeTeam.id, p.awayTeam.id);
  const titulo = [p.round?.numero ? `J${p.round.numero}` : null, p.field?.nombre].filter(Boolean).join(" · ");

  return (
    <main className="flex flex-col gap-3 px-4 pt-3 pb-6">
      <div className="flex min-h-11 items-center gap-2">
        <Link
          href={p.round?.numero ? `/mi-liga/rol?j=${p.round.numero}` : "/mi-liga/rol"}
          aria-label="Volver al rol de juegos"
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-lg"
        >
          <ArrowLeft aria-hidden className="size-5" />
        </Link>
        <h1 className="etiqueta flex-1 truncate text-sm font-extrabold tracking-[0.16em]">
          {validado
            ? `${nombreCorto(p.homeTeam.nombre)} ${p.homeScore}–${p.awayScore} ${nombreCorto(p.awayTeam.nombre)}`
            : titulo}
        </h1>
        <AccionPronto aria-label="Compartir el partido" className="inline-flex size-11 items-center justify-center rounded-lg border border-border bg-surface">
          <Share2 aria-hidden className="size-5" />
        </AccionPronto>
      </div>

      <Marcador p={p} validado={validado} arbitro={arbitro} />

      {validado ? (
        <Tabs defaultValue="resumen" className="gap-3">
          <TabsList variant="line" className="w-full justify-start gap-5 rounded-none border-b border-border p-0 group-data-horizontal/tabs:h-auto">
            {(
              [
                ["resumen", "Resumen"],
                ["alineaciones", "Alineaciones"],
                ["porra", "La porra"],
                ["mvp", "MVP"],
              ] as const
            ).map(([valor, texto]) => (
              <TabsTrigger
                key={valor}
                value={valor}
                className="etiqueta h-11 flex-none px-0 text-[13px] font-extrabold tracking-[0.12em] text-muted-foreground uppercase after:bg-role group-data-horizontal/tabs:after:-bottom-px group-data-horizontal/tabs:after:h-[3px] data-active:text-role dark:data-active:text-role"
              >
                {texto}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="resumen" className="flex flex-col gap-3">
            <Resumen p={p} resumen={resumen} />
            <AccionPronto className={buttonVariants({ variant: "lima", size: "cta", className: "w-full" })}>
              <Share2 aria-hidden />
              Compartir resultado
            </AccionPronto>
          </TabsContent>
          <TabsContent value="alineaciones" className="flex flex-col gap-3">
            <Alineaciones p={p} eventos={eventos} cambios={resumen.cambios} arbitro={arbitro} />
          </TabsContent>
          <TabsContent value="porra">
            <Pronto texto="La porra del partido llega con el feed y los comentarios." />
          </TabsContent>
          <TabsContent value="mvp">
            <Pronto texto="La votación del MVP llega con su fase: votan los dos equipos y la afición." />
          </TabsContent>
        </Tabs>
      ) : (
        <Tarjeta className="flex flex-col gap-1 p-3.5 text-sm">
          {p.status === "PROGRAMADO" ? (
            <>
              <p className="font-semibold">{p.field?.venue.nombre ?? "Cancha por confirmar"}</p>
              <p className="text-muted-foreground">
                {arbitro ? `Árbitro: ${arbitro}${p.refereeStatus === "ASIGNADO" ? " (por confirmar)" : ""}` : "Todavía sin árbitro"}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">La cédula espera la validación de la liga: hasta entonces no cuenta para la tabla.</p>
          )}
        </Tarjeta>
      )}
    </main>
  );
}

function Marcador({ p, validado, arbitro }: { p: Partido; validado: boolean; arbitro: string | null }) {
  const equipo = (t: Partido["homeTeam"], lado: "local" | "visita") => (
    <span className={cn("flex min-w-0 flex-1 flex-col items-center gap-1.5", lado === "visita" && "order-3")}>
      <Escudo {...coloresDe(t)} tamano={42} forma="escudo" conSiglas={false} />
      <span className="font-display w-full truncate text-center text-[19px] font-black uppercase italic">{nombreCorto(t.nombre)}</span>
    </span>
  );
  return (
    <Tarjeta className="flex flex-col gap-3 p-3.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {validado ? (
          chipsDelMarcador({ tipo: "cedula", arbitro: arbitro ?? undefined }).map((e) => <ChipEstado key={e.tipo} estado={e} />)
        ) : p.status === "PROGRAMADO" ? (
          <Chip>Programado</Chip>
        ) : (
          <Chip tono="ambar">Cédula por validar</Chip>
        )}
      </div>
      <div
        className="flex items-center gap-2"
        role="img"
        aria-label={
          validado
            ? `${p.homeTeam.nombre} ${p.homeScore}, ${p.awayTeam.nombre} ${p.awayScore}`
            : `${p.homeTeam.nombre} contra ${p.awayTeam.nombre}`
        }
      >
        {equipo(p.homeTeam, "local")}
        <span className="order-2 flex flex-col items-center">
          <span className="font-display text-[56px] leading-none font-black whitespace-nowrap">
            {validado ? `${p.homeScore}–${p.awayScore}` : p.scheduledAt ? horaCDMX(p.scheduledAt) : "vs"}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {p.scheduledAt
              ? validado
                ? conMayuscula(formatCDMX(p.scheduledAt, "EEE d MMM").replace(".", ""))
                : [horarioCorto(p.scheduledAt).split(" · ")[0], p.field?.nombre].filter(Boolean).join(" · ")
              : ""}
          </span>
        </span>
        {equipo(p.awayTeam, "visita")}
      </div>
    </Tarjeta>
  );
}

function Resumen({ p, resumen }: { p: Partido; resumen: ReturnType<typeof resumenDelPartido> }) {
  const columna = (goles: EventoCedula[], lado: "local" | "visita") => (
    <ul className={cn("flex flex-col gap-2.5", lado === "visita" && "items-end text-right")}>
      {goles.map((g, i) => (
        <li key={i} className={cn("flex items-start gap-2", lado === "visita" && "flex-row-reverse")}>
          <span className="font-display w-7 shrink-0 text-[17px] leading-tight font-black text-muted-foreground">
            {g.minuto != null ? `${g.minuto}'` : ""}
          </span>
          <span className={cn("flex flex-col gap-1", lado === "visita" && "items-end")}>
            <span className="text-[13px] font-semibold">⚽ {g.jugador}</span>
            {g.tipoGol && ETIQUETA_TIPO_GOL[g.tipoGol] && (
              <Chip tono={esGolazo(g.tipoGol) ? "lima" : "neutro"}>{ETIQUETA_TIPO_GOL[g.tipoGol]}</Chip>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
  const equipoDe = (id: string | null) => (id === p.homeTeam.id ? p.homeTeam : id === p.awayTeam.id ? p.awayTeam : null);
  return (
    <Tarjeta className="flex flex-col gap-3 p-3.5">
      <div className="flex items-center justify-between">
        <Sobretitulo className="text-muted-foreground">Goles</Sobretitulo>
        <span className="etiqueta text-[10px] tracking-[0.12em] text-muted-foreground">{resumen.total} eventos en la cédula</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {columna(resumen.golesLocal, "local")}
        {columna(resumen.golesVisita, "visita")}
      </div>
      {resumen.autogoles.map((a, i) => (
        <p key={`a${i}`} className="text-[13px] text-muted-foreground">
          {a.minuto != null ? `${a.minuto}' ` : ""}Autogol de {a.jugador}
        </p>
      ))}
      {(resumen.tarjetas.length > 0 || resumen.penales.length > 0) && (
        <ul className="flex flex-col gap-1.5 border-t border-border pt-2.5 text-[13px]">
          {resumen.tarjetas.map((t, i) => (
            <li key={`t${i}`} className="flex items-center gap-2">
              <span aria-hidden className={cn("h-4 w-3 shrink-0 rounded-[2px]", t.tipo === "ROJA" ? "bg-danger" : "bg-amarilla")} />
              <span>
                <b>{t.minuto != null ? `${t.minuto}' ` : ""}</b>
                {t.jugador}
                <span className="text-muted-foreground">
                  {" · "}
                  {nombreCorto(equipoDe(t.equipoId)?.nombre ?? "")}
                  {t.nota ? ` · ${t.nota}` : ""}
                </span>
              </span>
              <span className="sr-only">{t.tipo === "ROJA" ? "tarjeta roja" : "tarjeta amarilla"}</span>
            </li>
          ))}
          {resumen.penales.map((pe, i) => (
            <li key={`p${i}`} className="text-muted-foreground">
              {pe.minuto != null ? `${pe.minuto}' ` : ""}
              {pe.tipo === "PENAL_ATAJADO" ? `Penal atajado por ${pe.jugador}` : `Penal fallado por ${pe.jugador}`}
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}

function Alineaciones({
  p,
  eventos,
  cambios,
  arbitro,
}: {
  p: Partido;
  eventos: EventoCedula[];
  cambios: EventoCedula[];
  arbitro: string | null;
}) {
  const de = (t: Partido["homeTeam"]) =>
    alineacionConMarcas(
      (p.lineups.find((l) => l.teamId === t.id)?.players ?? []).map((x) => ({
        userId: x.user.id,
        username: x.user.username,
        nombre: nombreVisible(x.user),
        numero: x.numero,
        titular: x.titular,
        posicion: x.posicion,
        capitan: x.capitan,
      })),
      eventos,
    );
  const firmas = [nombreDeFirma(p.report?.homeSignedBy ?? null), nombreDeFirma(p.report?.awaySignedBy ?? null)].filter(Boolean);
  const dorsal = (id: string | null) => {
    for (const l of p.lineups) for (const x of l.players) if (x.user.id === id) return x.numero;
    return null;
  };
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {[p.homeTeam, p.awayTeam].map((t) => (
          <Tarjeta key={t.id} className="flex min-w-0 flex-col gap-1 p-2.5">
            <p className="flex items-center gap-1.5 pb-1">
              <Escudo {...coloresDe(t)} tamano={16} conSiglas={false} />
              <span className="etiqueta truncate text-xs font-extrabold tracking-[0.1em]">{nombreCorto(t.nombre)}</span>
            </p>
            <Lista filas={de(t)} />
          </Tarjeta>
        ))}
      </div>
      {cambios.length > 0 && (
        <Tarjeta className="flex flex-col gap-1.5 p-3 text-[13px]">
          {cambios.map((c, i) => (
            <p key={i} className="flex items-center gap-2">
              <ArrowLeftRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <span>
                <b>{c.minuto != null ? `${c.minuto}' ` : ""}</b>
                Entra {dorsal(c.jugadorId) != null ? `#${dorsal(c.jugadorId)} ` : ""}
                {c.jugador} por {dorsal(c.saleId ?? null) != null ? `#${dorsal(c.saleId ?? null)} ` : ""}
                {c.sale}
              </span>
            </p>
          ))}
        </Tarjeta>
      )}
      {(firmas.length > 0 || arbitro) && (
        <p className="flex items-start gap-2 rounded-2xl border border-border p-3 text-xs text-muted-foreground">
          <FileCheck2 aria-hidden className="size-4 shrink-0 text-success" />
          <span>
            {firmas.length ? `Cédula firmada por ${firmas.join(" y ")}` : "Cédula capturada por la liga"}
            {arbitro ? ` · árbitro ${arbitro}` : ""}
          </span>
        </p>
      )}
    </>
  );
}

function Lista({ filas }: { filas: FilaAlineacion[] }) {
  const titulares = filas.filter((f) => f.titular);
  const banca = filas.filter((f) => !f.titular);
  const fila = (f: FilaAlineacion) => (
    <li key={f.userId}>
      <Link href={`/j/${f.username}`} className="flex min-h-8 items-center gap-1.5 text-[12px]">
        <span className="font-display w-5 shrink-0 text-[14px] font-black">{f.numero}</span>
        <span className="min-w-0 flex-1 truncate">
          {f.nombre}
          {f.capitan ? " ©" : ""}
        </span>
        <span className="flex shrink-0 items-center gap-0.5">
          {Array.from({ length: f.goles }, (_, i) => (
            <span key={i} aria-label="gol" className="text-[11px]">
              ⚽
            </span>
          ))}
          {f.amarillas > 0 && <span aria-label="amarilla" className="h-3 w-2 rounded-[1px] bg-amarilla" />}
          {f.roja && <span aria-label="roja" className="h-3 w-2 rounded-[1px] bg-danger" />}
          {f.salio && <ArrowDown aria-label="salió" className="size-3.5 text-danger" />}
          {f.entro && <ArrowUp aria-label="entró" className="size-3.5 text-success" />}
        </span>
      </Link>
    </li>
  );
  return (
    <>
      <ul>{titulares.map(fila)}</ul>
      {banca.length > 0 && (
        <>
          <span className="etiqueta pt-1 text-[10px] tracking-[0.12em] text-muted-foreground">Banca</span>
          <ul>{banca.map(fila)}</ul>
        </>
      )}
    </>
  );
}

function Pronto({ texto }: { texto: string }) {
  return (
    <Tarjeta className="p-4 text-sm text-muted-foreground">
      <Chip className="mb-2">Llega pronto</Chip>
      <p>{texto}</p>
    </Tarjeta>
  );
}
