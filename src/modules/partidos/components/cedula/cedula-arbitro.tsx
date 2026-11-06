"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Contrast, Flag, Info, Pencil, RefreshCw, Send, Signature, WifiOff, X } from "lucide-react";
import { toast } from "sonner";
import { inicialesDe } from "@/shared/lib/personas";
import { cn } from "@/shared/lib/utils";
import { BotonLima, Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { Escudo } from "@/shared/ui/escudo";
import { Sobretitulo } from "@/shared/ui/tarjeta";
import { enviarCedula } from "../../server/actions";
import {
  agregarTarjeta,
  lineaDeGoles,
  marcadorDeLaCedula,
  problemasDeLaCedula,
  quitarEvento,
  quitarJugador,
  TIPOS_DE_GOL,
  type EventoCapturado,
  type TipoDeGol,
} from "../../server/services/cedula";
import { FirmaConElDedo } from "./firma-con-el-dedo";
import { CHIP_TIPO_GOL, type EquipoCedula } from "./tipos";

// Cédula al final del partido (pantallas 56a y 56b · PRD §7.7): equipo → quién jugó → goles → tarjetas →
// notas → resumen → firmas en este celular → enviar. Todo se guarda en el celular y se manda solo al volver la señal.

type Paso = "jugaron" | "goles" | "tarjetas" | "notas" | "resumen" | "firma" | "lista";
const PASOS: { clave: Paso; etiqueta: string }[] = [
  { clave: "jugaron", etiqueta: "1 Jugaron" },
  { clave: "goles", etiqueta: "2 Goles" },
  { clave: "tarjetas", etiqueta: "3 Tarjetas" },
  { clave: "notas", etiqueta: "4 Notas" },
];
const ETIQUETAS_NOTAS = ["Sin incidentes", "Lesión", "Pelea", "Se suspendió", "Cancha en mal estado"];
const MOTIVOS_TARJETA = ["Falta", "Protestar", "Mano", "Otra"];

type FirmaHecha = { teamId: string; firmanteId: string; trazo: string; huella: string };
type Borrador = {
  clientId: string;
  paso: Paso;
  jugaron: Record<string, string[]>;
  eventos: EventoCapturado[];
  etiquetas: string[];
  observaciones: string;
  firmas: FirmaHecha[];
  /** Equipos que firman después, en su celular */
  firmanDespues: string[];
  porEnviar: boolean;
  guardadoEn: string | null;
};

const uuid = () => crypto.randomUUID();
/** Huella de lo que se firma: si el árbitro cambia algo después, esa firma ya no vale */
function huellaDe(b: Pick<Borrador, "jugaron" | "eventos" | "etiquetas" | "observaciones">) {
  const texto = JSON.stringify([Object.entries(b.jugaron).map(([k, v]) => [k, [...v].sort()]).sort(), b.eventos, b.etiquetas, b.observaciones.trim()]);
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
  return String(h >>> 0);
}
const textoObservaciones = (b: Borrador) => [b.etiquetas.join(" · "), b.observaciones.trim()].filter(Boolean).join(". ");

function useEnLinea() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

const sinSuscripcion = () => () => {};

function leer<T>(clave: string): T | null {
  try {
    const v = localStorage.getItem(clave);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function guardar(clave: string, valor: unknown) {
  try {
    if (valor == null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin espacio o en modo privado: la cédula sigue en pantalla
  }
}

export function CedulaArbitro({
  matchId,
  sobretitulo,
  local,
  visita,
  volver,
}: {
  matchId: string;
  /** "J16 · Cancha 2 · 17:00" */
  sobretitulo: string;
  local: EquipoCedula;
  visita: EquipoCedula;
  volver: string;
}) {
  const clave = `chilena:cedula:${matchId}`;
  // El borrador vive en el celular (sin señal no se pierde nada). Se lee al montar: en el servidor no hay celular.
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const [nuevo] = useState(
    (): Borrador => ({
      clientId: uuid(),
      paso: "jugaron",
      jugaron: Object.fromEntries([local, visita].map((e) => [e.teamId, e.jugadores.filter((j) => j.enAlineacion).map((j) => j.userId)])),
      eventos: [],
      etiquetas: [],
      observaciones: "",
      firmas: [],
      firmanDespues: [],
      porEnviar: false,
      guardadoEn: null,
    }),
  );
  const guardado = useMemo(() => (montado ? leer<Borrador>(clave) : null), [montado, clave]);
  const [editado, setEditado] = useState<Borrador | null>(null);
  const b = editado ?? guardado ?? (montado ? nuevo : null);
  const [altoElegido, setAlto] = useState<boolean | null>(null);
  const alto = altoElegido ?? (montado ? (leer<boolean>("chilena:cedula:alto-contraste") ?? false) : false);
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  /** El último intento no encontró señal */
  const [sinSenal, setSinSenal] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const enviandoRef = useRef(false);
  /** Ya llegó al servidor: no se vuelve a guardar ni a mandar */
  const enviadaRef = useRef(false);
  const enLinea = useEnLinea();

  useEffect(() => {
    if (editado && !enviadaRef.current) guardar(clave, editado);
  }, [clave, editado]);

  const cambiar = (f: (x: Borrador) => Borrador) =>
    setEditado((x) => {
      const base = x ?? b;
      return base ? { ...f(base), guardadoEn: new Date().toISOString() } : x;
    });
  const ir = (paso: Paso) => {
    cambiar((x) => ({ ...x, paso }));
    window.scrollTo({ top: 0 });
  };

  const equipos = [local, visita];
  const equipo = (id: string) => (id === local.teamId ? local : visita);
  const rival = (id: string) => (id === local.teamId ? visita : local);
  const nombres = useMemo(() => Object.fromEntries([local, visita].flatMap((e) => e.jugadores.map((j) => [j.userId, j.nombre]))), [local, visita]);
  const numeros = useMemo(() => Object.fromEntries([local, visita].flatMap((e) => e.jugadores.map((j) => [j.userId, j.numero]))), [local, visita]);

  const intentar = useCallback(
    async (x: Borrador) => {
      if (enviandoRef.current || enviadaRef.current) return;
      enviandoRef.current = true;
      setEnviando(true);
      const huella = huellaDe(x);
      try {
        const r = await enviarCedula({
          matchId,
          clientId: x.clientId,
          jugaron: [local, visita].map((e) => ({ teamId: e.teamId, userIds: x.jugaron[e.teamId] ?? [] })),
          eventos: x.eventos,
          observaciones: textoObservaciones(x),
          firmas: x.firmas.filter((f) => f.huella === huella).map(({ teamId, firmanteId, trazo }) => ({ teamId, firmanteId, trazo })),
        });
        if (r.ok) {
          enviadaRef.current = true;
          guardar(clave, null);
          setSinSenal(false);
          setEnviada(true);
          router.refresh();
          toast.success(r.estado === "FINALIZADO" ? "Cédula enviada y firmada. Ya la tiene la liga." : "Cédula enviada. Les llegó a los delegados para firmar.");
        } else {
          setEditado({ ...x, porEnviar: false });
          toast.error(r.error);
        }
      } catch {
        // Sin señal: se queda guardada y se manda sola al volver
        setSinSenal(true);
        toast("Sin señal: la cédula se queda guardada y se manda sola al volver la señal.");
      } finally {
        enviandoRef.current = false;
        setEnviando(false);
      }
    },
    [clave, matchId, local, visita, router],
  );

  // Se manda sola al volver la señal (o al abrir otra vez esta cédula con una pendiente)
  useEffect(() => {
    if (!b?.porEnviar) return;
    const mandar = () => void intentar(b);
    const t = navigator.onLine ? window.setTimeout(mandar, 0) : undefined;
    window.addEventListener("online", mandar);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("online", mandar);
    };
  }, [b, intentar]);

  if (!b) return <div className="min-h-dvh bg-background" aria-busy />;

  const huella = huellaDe(b);
  const firmas = b.firmas.filter((f) => f.huella === huella);
  const marcador = marcadorDeLaCedula(b.eventos, local.teamId, visita.teamId);
  const problemas = problemasDeLaCedula(
    { jugaron: b.jugaron, eventos: b.eventos, observaciones: b.observaciones },
    {
      localId: local.teamId,
      visitaId: visita.teamId,
      inscritos: Object.fromEntries(equipos.map((e) => [e.teamId, e.jugadores.filter((j) => !j.bloqueado).map((j) => j.userId)])),
      suspendidos: [],
      nombres,
    },
  );
  // Quién falta por firmar en este celular (si su equipo tiene delegado en la app y no firma después)
  const porFirmar = equipos.filter((e) => e.delegados.length && !firmas.some((f) => f.teamId === e.teamId) && !b.firmanDespues.includes(e.teamId));

  function enviar() {
    cambiar((x) => ({ ...x, porEnviar: true }));
    if (!navigator.onLine) toast("Sin señal: la cédula se queda guardada y se manda sola al volver la señal.");
  }

  return (
    <div className={cn("flex min-h-dvh flex-col bg-background text-foreground", alto && "alto-contraste")} data-role="arbitro">
      {!enLinea && (
        <div className="flex items-center gap-2 bg-warning px-4 py-1.5 text-[12px] font-bold text-ink" role="status">
          <WifiOff aria-hidden className="size-4" />
          <span className="flex-1">Sin señal · todo se guarda en el celular</span>
        </div>
      )}
      <header className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-background px-4 pt-2 pb-2.5">
        <div className="flex items-center gap-2">
          <Link href={volver} aria-label="Volver a mis partidos" className="-ml-2 flex size-11 items-center justify-center">
            <ArrowLeft aria-hidden className="size-5" />
          </Link>
          <span className="etiqueta flex-1 text-[13px] tracking-[0.14em]">
            Cédula · {local.siglas} {marcador.local}–{marcador.visita} {visita.siglas}
          </span>
          <button
            type="button"
            aria-pressed={alto}
            aria-label="Alto contraste"
            onClick={() => {
              setAlto(!alto);
              guardar("chilena:cedula:alto-contraste", !alto);
            }}
            className={cn("flex h-9 items-center gap-1.5 rounded-full border border-border px-2.5 text-[11px] font-bold uppercase", alto && "bg-foreground text-background")}
          >
            <Contrast aria-hidden className="size-4" />
            {alto && "Alto contraste"}
          </button>
        </div>
        {PASOS.some((p) => p.clave === b.paso) && (
          <nav aria-label="Pasos de la cédula" className="grid grid-cols-4 gap-1.5">
            {PASOS.map((p, i) => {
              const actual = PASOS.findIndex((x) => x.clave === b.paso);
              return (
                <button
                  key={p.clave}
                  type="button"
                  onClick={() => ir(p.clave)}
                  aria-current={p.clave === b.paso ? "step" : undefined}
                  className="flex min-h-9 flex-col gap-1 text-left"
                >
                  <span className={cn("h-1 rounded-full", i <= actual ? "bg-role" : "bg-surface-2")} />
                  <span className={cn("etiqueta text-[10px] tracking-[0.1em]", p.clave === b.paso ? "text-role" : "text-muted-foreground")}>{p.etiqueta}</span>
                </button>
              );
            })}
          </nav>
        )}
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pt-3 pb-28">
        <Sobretitulo className="text-muted-foreground">{sobretitulo}</Sobretitulo>
        {b.paso === "jugaron" && (
          <PasoJugaron
            b={b}
            equipos={equipos}
            onMarcar={(teamId, userId, marcado) => {
              if (!marcado && b.eventos.some((e) => e.jugadorId === userId)) toast(`Se quitaron los goles y tarjetas de ${nombres[userId]}.`);
              cambiar((x) =>
                marcado ? { ...x, jugaron: { ...x.jugaron, [teamId]: [...(x.jugaron[teamId] ?? []), userId] } } : { ...x, ...quitarJugador(x, teamId, userId) },
              );
            }}
          />
        )}
        {b.paso === "goles" && (
          <PasoGoles
            b={b}
            local={local}
            visita={visita}
            marcador={marcador}
            nombres={nombres}
            numeros={numeros}
            rival={rival}
            equipo={equipo}
            onAgregar={(e) => cambiar((x) => ({ ...x, eventos: [...x.eventos, e] }))}
            onQuitar={(id) => cambiar((x) => ({ ...x, eventos: quitarEvento(x.eventos, id) }))}
          />
        )}
        {b.paso === "tarjetas" && (
          <PasoTarjetas
            b={b}
            equipos={equipos}
            nombres={nombres}
            numeros={numeros}
            equipo={equipo}
            onAgregar={(t) => {
              const r = agregarTarjeta(b.eventos, t, uuid());
              if (r.rechazada) return toast.error(`${nombres[t.jugadorId]} ya está expulsado.`);
              if (r.dobleAmarilla) toast(`Segunda amarilla de ${nombres[t.jugadorId]}: va la roja.`);
              cambiar((x) => ({ ...x, eventos: r.eventos }));
            }}
            onQuitar={(id) => cambiar((x) => ({ ...x, eventos: quitarEvento(x.eventos, id) }))}
          />
        )}
        {b.paso === "notas" && (
          <PasoNotas
            b={b}
            onEtiqueta={(t) =>
              cambiar((x) => ({ ...x, etiquetas: x.etiquetas.includes(t) ? x.etiquetas.filter((y) => y !== t) : [...x.etiquetas, t] }))
            }
            onTexto={(observaciones) => cambiar((x) => ({ ...x, observaciones }))}
          />
        )}
        {b.paso === "resumen" && (
          <PasoResumen b={b} local={local} visita={visita} marcador={marcador} nombres={nombres} firmas={firmas} problemas={problemas} onEditar={ir} />
        )}
        {b.paso === "firma" && porFirmar[0] && (
          <PasoFirma
            key={porFirmar[0].teamId}
            equipo={porFirmar[0]}
            numero={equipos.filter((e) => e.delegados.length).indexOf(porFirmar[0]) + 1}
            total={equipos.filter((e) => e.delegados.length).length}
            local={local}
            visita={visita}
            marcador={marcador}
            linea={lineaDeGoles(b.eventos, nombres)}
            tarjetas={b.eventos.filter((e) => e.tipo === "AMARILLA" || e.tipo === "ROJA").length}
            yaFirmo={firmas.map((f) => equipos.find((e) => e.teamId === f.teamId)?.delegados.find((d) => d.userId === f.firmanteId)?.nombre).filter(Boolean) as string[]}
            onFirmar={(firmanteId, trazo) => {
              cambiar((x) => ({ ...x, firmas: [...x.firmas.filter((f) => f.teamId !== porFirmar[0].teamId), { teamId: porFirmar[0].teamId, firmanteId, trazo, huella }] }));
              if (porFirmar.length === 1) ir("lista");
            }}
            onDespues={() => {
              cambiar((x) => ({ ...x, firmanDespues: [...x.firmanDespues, porFirmar[0].teamId] }));
              if (porFirmar.length === 1) ir("lista");
            }}
            onCorregir={() => {
              toast("Corrijan juntos la cédula y vuelvan a firmar.");
              ir("resumen");
            }}
          />
        )}
        {(b.paso === "lista" || (b.paso === "firma" && !porFirmar[0])) && (
          <PasoLista
            local={local}
            visita={visita}
            marcador={marcador}
            firmas={firmas}
            porEnviar={b.porEnviar && !enviada}
            enLinea={enLinea && !sinSenal}
            enviando={enviando}
            guardadoEn={b.guardadoEn}
            onReintentar={() => intentar(b)}
          />
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-[560px] flex-col gap-2 bg-background/95 px-4 pt-2 pb-[max(12px,env(safe-area-inset-bottom))]">
        {b.paso === "jugaron" && (
          <BotonLima
            className="w-full"
            onClick={() => {
              const sinMarcar = equipos.find((e) => !(b.jugaron[e.teamId] ?? []).length);
              if (sinMarcar) return toast(`Marca quién jugó de ${sinMarcar.corto}.`);
              ir("goles");
            }}
          >
            Siguiente · Goles
          </BotonLima>
        )}
        {b.paso === "goles" && (
          <BotonLima className="w-full" onClick={() => ir("tarjetas")}>
            Siguiente · Tarjetas
          </BotonLima>
        )}
        {b.paso === "tarjetas" && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="quieto" size="cta" className="border border-border" onClick={() => ir("notas")}>
              Sin más tarjetas
            </Button>
            <BotonLima onClick={() => ir("notas")}>Siguiente</BotonLima>
          </div>
        )}
        {b.paso === "notas" && (
          <BotonLima className="w-full" onClick={() => ir("resumen")}>
            Ver resumen
          </BotonLima>
        )}
        {b.paso === "resumen" && (
          <>
            {porFirmar.length > 0 ? (
              <BotonLima className="w-full" disabled={problemas.length > 0} onClick={() => ir("firma")}>
                <Signature aria-hidden />
                Pedir firmas
              </BotonLima>
            ) : (
              <BotonLima className="w-full" disabled={problemas.length > 0} onClick={() => ir("lista")}>
                <Check aria-hidden />
                Lista para enviar
              </BotonLima>
            )}
            <Button variant="quieto" size="cta" className="w-full border border-border" disabled={problemas.length > 0 || b.porEnviar} onClick={enviar}>
              Enviar ya · firman en su celular
            </Button>
          </>
        )}
        {(b.paso === "lista" || (b.paso === "firma" && !porFirmar[0])) && (
          <BotonLima className="w-full" disabled={problemas.length > 0 || b.porEnviar || enviando || enviada} onClick={enviar}>
            {enviada ? <Check aria-hidden /> : <Send aria-hidden />}
            {enviada ? "Enviada" : enviando ? "Enviando…" : b.porEnviar ? "Se manda al volver la señal" : "Enviar cédula"}
          </BotonLima>
        )}
      </footer>
    </div>
  );
}

// ---------- Piezas

function SelectorEquipo({ equipos, valor, onCambio, chico }: { equipos: EquipoCedula[]; valor: string; onCambio: (id: string) => void; chico?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Equipo" className="grid grid-cols-2 gap-1.5 rounded-xl bg-surface-2 p-1">
      {equipos.map((e) => (
        <button
          key={e.teamId}
          type="button"
          role="radio"
          aria-checked={valor === e.teamId}
          onClick={() => onCambio(e.teamId)}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border border-transparent px-2 font-condensed font-extrabold tracking-[0.1em] uppercase",
            chico ? "min-h-11 text-[12px]" : "min-h-12 text-[13px]",
            valor === e.teamId && "border-role bg-background",
          )}
        >
          <Escudo {...e.colores} tamano={18} conSiglas={false} />
          {e.corto}
        </button>
      ))}
    </div>
  );
}

function Cuadricula({
  jugadores,
  valor,
  onCambio,
  extra,
}: {
  jugadores: { userId: string; nombre: string; numero: number | null }[];
  valor: string | null;
  onCambio: (id: string) => void;
  extra?: React.ReactNode;
}) {
  if (!jugadores.length && !extra) return <p className="text-sm text-muted-foreground">Primero marca quién jugó.</p>;
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {jugadores.map((j) => (
        <button
          key={j.userId}
          type="button"
          aria-pressed={valor === j.userId}
          aria-label={`${j.numero != null ? `#${j.numero} ` : ""}${j.nombre}`}
          title={j.nombre}
          onClick={() => onCambio(j.userId)}
          className={cn(
            "flex min-h-12 flex-col items-center justify-center rounded-lg border border-border bg-background px-0.5",
            valor === j.userId && "border-transparent bg-role text-background",
          )}
        >
          <span className="font-display text-[20px] leading-none font-black">{j.numero ?? inicialesDe(j.nombre)}</span>
          <span className="w-full truncate text-center text-[9px] leading-tight opacity-80">{j.nombre.replace(/^(El|La) /, "")}</span>
        </button>
      ))}
      {extra}
    </div>
  );
}

function Chips<T extends string>({ opciones, valor, onCambio, etiqueta }: { opciones: readonly T[]; valor: T | null; onCambio: (v: T) => void; etiqueta: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opciones.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={valor === o}
          onClick={() => onCambio(o)}
          className={cn(
            "etiqueta min-h-9 rounded-full border border-border px-3 text-[11px] tracking-[0.08em]",
            valor === o && "border-transparent bg-brand-lime text-ink",
          )}
        >
          {etiqueta(o)}
        </button>
      ))}
    </div>
  );
}

function Minuto({ valor, onCambio }: { valor: string; onCambio: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={3}
        value={valor}
        onChange={(e) => onCambio(e.target.value.replace(/\D/g, ""))}
        placeholder="87'"
        aria-label="Minuto"
        className="h-11 w-16 rounded-lg border border-border bg-background px-2 text-center font-display text-[18px] font-black text-foreground"
      />
      Minuto opcional
    </label>
  );
}

const minutoDe = (v: string) => (v === "" ? null : Math.min(130, Number(v)));

function Marcador({ local, visita, marcador }: { local: EquipoCedula; visita: EquipoCedula; marcador: { local: number; visita: number } }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Escudo {...local.colores} tamano={28} forma="escudo" />
      <span className="font-display text-[52px] leading-none font-black text-role" aria-label={`${local.corto} ${marcador.local}, ${visita.corto} ${marcador.visita}`}>
        {marcador.local}–{marcador.visita}
      </span>
      <Escudo {...visita.colores} tamano={28} forma="escudo" />
    </div>
  );
}

function FilaEvento({ e, nombres, numeros, equipo, onQuitar, detalle }: {
  e: EventoCapturado;
  nombres: Record<string, string>;
  numeros: Record<string, number | null>;
  equipo: (id: string) => EquipoCedula;
  onQuitar: (id: string) => void;
  detalle?: React.ReactNode;
}) {
  const tarjeta = e.tipo === "AMARILLA" || e.tipo === "ROJA";
  return (
    <li className="flex min-h-12 items-center gap-2.5 rounded-xl border border-border bg-surface px-3">
      {tarjeta ? (
        <span aria-hidden className={cn("h-5 w-3.5 rounded-[3px]", e.tipo === "AMARILLA" ? "bg-amarilla" : "bg-danger")} />
      ) : (
        <span aria-hidden className="flex size-5 items-center justify-center rounded-full border-2 border-current text-[9px] font-black">
          {e.tipo === "AUTOGOL" ? "AG" : "⚽"}
        </span>
      )}
      <span className="flex-1 text-[14px] leading-tight">
        <strong className="font-semibold">
          {tarjeta && numeros[e.jugadorId] != null ? `#${numeros[e.jugadorId]} ` : ""}
          {e.tipo === "AUTOGOL" ? `Autogol de ${nombres[e.jugadorId]}` : nombres[e.jugadorId]}
        </strong>
        <span className="text-muted-foreground"> · {equipo(e.equipoId).siglas}</span>
        {e.nota && <span className="block text-[12px] text-muted-foreground">{e.nota}</span>}
      </span>
      {detalle}
      {e.minuto != null && <span className="font-display text-[18px] font-black">{e.minuto}&apos;</span>}
      <button type="button" onClick={() => onQuitar(e.id)} aria-label={`Quitar ${e.tipo.toLowerCase()} de ${nombres[e.jugadorId]}`} className="-mr-2 flex size-11 items-center justify-center text-muted-foreground">
        <X aria-hidden className="size-4" />
      </button>
    </li>
  );
}

// ---------- Pasos

function PasoJugaron({ b, equipos, onMarcar }: { b: Borrador; equipos: EquipoCedula[]; onMarcar: (teamId: string, userId: string, marcado: boolean) => void }) {
  const [teamId, setTeamId] = useState(equipos[0].teamId);
  const e = equipos.find((x) => x.teamId === teamId)!;
  const marcados = new Set(b.jugaron[teamId] ?? []);
  const disponibles = e.jugadores.filter((j) => !j.bloqueado).length;
  return (
    <section className="flex flex-col gap-3" aria-labelledby="quien-jugo">
      <SelectorEquipo equipos={equipos} valor={teamId} onCambio={setTeamId} />
      <div className="flex items-end justify-between">
        <h1 id="quien-jugo" className="titular-momento text-[34px]">¿Quién jugó?</h1>
        <span className="text-[12px] text-muted-foreground">
          {marcados.size} de {disponibles}
        </span>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {e.jugadores.map((j) => (
          <li key={j.userId}>
            <label className={cn("flex min-h-12 items-center gap-3", j.bloqueado && "opacity-60")}>
              <input
                type="checkbox"
                className="size-6 accent-[var(--role-accent)]"
                checked={marcados.has(j.userId)}
                disabled={j.bloqueado}
                onChange={(ev) => onMarcar(teamId, j.userId, ev.target.checked)}
              />
              <span className="font-display w-7 text-center text-[22px] leading-none font-black">{j.numero ?? "–"}</span>
              <span className="flex-1 text-[15px]">{j.nombre}</span>
              {j.motivo && <Chip tono="rojo">{j.motivo}</Chip>}
            </label>
          </li>
        ))}
      </ul>
      <p className="text-[12px] text-muted-foreground">
        {e.conAlineacion
          ? `Ya viene marcada la alineación que mandó ${e.delegados[0]?.nombre ?? "el delegado"}.`
          : `${e.corto} no mandó alineación: marca quién jugó.`}
      </p>
    </section>
  );
}

function PasoGoles({
  b,
  local,
  visita,
  marcador,
  nombres,
  numeros,
  rival,
  equipo,
  onAgregar,
  onQuitar,
}: {
  b: Borrador;
  local: EquipoCedula;
  visita: EquipoCedula;
  marcador: { local: number; visita: number };
  nombres: Record<string, string>;
  numeros: Record<string, number | null>;
  rival: (id: string) => EquipoCedula;
  equipo: (id: string) => EquipoCedula;
  onAgregar: (e: EventoCapturado) => void;
  onQuitar: (id: string) => void;
}) {
  const [teamId, setTeamId] = useState(local.teamId);
  const [autogol, setAutogol] = useState(false);
  const [jugador, setJugador] = useState<string | null>(null);
  const [tipoGol, setTipoGol] = useState<TipoDeGol>("JUGADA");
  const [minuto, setMinuto] = useState("");
  // En el autogol se elige al rival que lo metió en su portería
  const deQuien = autogol ? rival(teamId) : equipo(teamId);
  const jugaron = deQuien.jugadores.filter((j) => (b.jugaron[deQuien.teamId] ?? []).includes(j.userId));
  const goles = b.eventos.filter((e) => e.tipo === "GOL" || e.tipo === "AUTOGOL").sort((x, y) => (x.minuto ?? 999) - (y.minuto ?? 999));
  return (
    <section className="flex flex-col gap-3" aria-label="Goles">
      <Marcador local={local} visita={visita} marcador={marcador} />
      <ul className="flex flex-col gap-1.5">
        {goles.map((g) => (
          <FilaEvento
            key={g.id}
            e={g}
            nombres={nombres}
            numeros={numeros}
            equipo={equipo}
            onQuitar={onQuitar}
            detalle={g.tipoGol && g.tipoGol !== "JUGADA" ? <Chip tono={g.tipoGol === "PANENKA" || g.tipoGol === "CHILENA" ? "lima" : "neutro"}>{CHIP_TIPO_GOL[g.tipoGol]}</Chip> : null}
          />
        ))}
        {!goles.length && <li className="text-sm text-muted-foreground">Sin goles todavía. Si quedó 0–0, sigue a tarjetas.</li>}
      </ul>
      <div className="flex flex-col gap-3 rounded-2xl border border-role bg-surface p-3">
        <Sobretitulo className="text-role">
          Nuevo {autogol ? "autogol" : "gol"} · {equipo(teamId).corto} · ¿quién{autogol ? ` de ${deQuien.corto}` : ""}?
        </Sobretitulo>
        <SelectorEquipo
          chico
          equipos={[local, visita]}
          valor={teamId}
          onCambio={(id) => {
            setTeamId(id);
            setJugador(null);
          }}
        />
        <Cuadricula
          jugadores={jugaron}
          valor={jugador}
          onCambio={setJugador}
          extra={
            <button
              type="button"
              aria-pressed={autogol}
              aria-label="Autogol del rival"
              onClick={() => {
                setAutogol(!autogol);
                setJugador(null);
              }}
              className={cn("flex min-h-12 items-center justify-center rounded-lg border border-dashed border-border font-display text-[18px] font-black", autogol && "border-solid border-transparent bg-amarilla text-ink")}
            >
              AG
            </button>
          }
        />
        {!autogol && <Chips opciones={TIPOS_DE_GOL} valor={tipoGol} onCambio={setTipoGol} etiqueta={(t) => CHIP_TIPO_GOL[t]} />}
        <div className="flex items-center justify-between gap-2">
          <Minuto valor={minuto} onCambio={setMinuto} />
          <BotonLima
            className="h-11 px-5"
            disabled={!jugador}
            onClick={() => {
              onAgregar({
                id: uuid(),
                tipo: autogol ? "AUTOGOL" : "GOL",
                equipoId: deQuien.teamId,
                jugadorId: jugador!,
                minuto: minutoDe(minuto),
                tipoGol: autogol ? null : tipoGol,
                nota: null,
              });
              setJugador(null);
              setMinuto("");
              setTipoGol("JUGADA");
              setAutogol(false);
            }}
          >
            Agregar
          </BotonLima>
        </div>
      </div>
    </section>
  );
}

function PasoTarjetas({
  b,
  equipos,
  nombres,
  numeros,
  equipo,
  onAgregar,
  onQuitar,
}: {
  b: Borrador;
  equipos: EquipoCedula[];
  nombres: Record<string, string>;
  numeros: Record<string, number | null>;
  equipo: (id: string) => EquipoCedula;
  onAgregar: (t: EventoCapturado) => void;
  onQuitar: (id: string) => void;
}) {
  const [color, setColor] = useState<"AMARILLA" | "ROJA">("AMARILLA");
  const [teamId, setTeamId] = useState(equipos[0].teamId);
  const [jugador, setJugador] = useState<string | null>(null);
  const [motivo, setMotivo] = useState<string | null>(null);
  const [minuto, setMinuto] = useState("");
  const e = equipo(teamId);
  const jugaron = e.jugadores.filter((j) => (b.jugaron[teamId] ?? []).includes(j.userId));
  const tarjetas = b.eventos.filter((x) => x.tipo === "AMARILLA" || x.tipo === "ROJA").sort((x, y) => (x.minuto ?? 999) - (y.minuto ?? 999));
  return (
    <section className="flex flex-col gap-3" aria-labelledby="tarjetas">
      <h1 id="tarjetas" className="titular-momento text-[34px]">Tarjetas</h1>
      <ul className="flex flex-col gap-1.5">
        {tarjetas.map((t) => (
          <FilaEvento key={t.id} e={t} nombres={nombres} numeros={numeros} equipo={equipo} onQuitar={onQuitar} />
        ))}
        {!tarjetas.length && <li className="text-sm text-muted-foreground">Sin tarjetas. Si no hubo, sigue.</li>}
      </ul>
      <div className="flex flex-col gap-3 rounded-2xl border border-role bg-surface p-3">
        <Sobretitulo className="text-role">Nueva tarjeta</Sobretitulo>
        <div role="radiogroup" aria-label="Color" className="grid grid-cols-2 gap-2">
          {(["AMARILLA", "ROJA"] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              onClick={() => setColor(c)}
              className={cn(
                "flex min-h-14 items-center justify-center gap-2 rounded-xl border border-border font-condensed text-[15px] font-extrabold tracking-[0.12em] uppercase",
                color === c && (c === "AMARILLA" ? "border-amarilla bg-amarilla/15" : "border-danger bg-danger/12"),
              )}
            >
              <span aria-hidden className={cn("h-6 w-4 rounded-[3px]", c === "AMARILLA" ? "bg-amarilla" : "bg-danger")} />
              {c === "AMARILLA" ? "Amarilla" : "Roja"}
            </button>
          ))}
        </div>
        <SelectorEquipo
          chico
          equipos={equipos}
          valor={teamId}
          onCambio={(id) => {
            setTeamId(id);
            setJugador(null);
          }}
        />
        <Cuadricula jugadores={jugaron} valor={jugador} onCambio={setJugador} />
        <Chips opciones={MOTIVOS_TARJETA} valor={motivo} onCambio={(m) => setMotivo(motivo === m ? null : m)} etiqueta={(m) => m} />
        <div className="flex items-center justify-between gap-2">
          <Minuto valor={minuto} onCambio={setMinuto} />
          <BotonLima
            className="h-11 px-5"
            disabled={!jugador}
            onClick={() => {
              onAgregar({ id: uuid(), tipo: color, equipoId: teamId, jugadorId: jugador!, minuto: minutoDe(minuto), tipoGol: null, nota: motivo });
              setJugador(null);
              setMotivo(null);
              setMinuto("");
            }}
          >
            Agregar
          </BotonLima>
        </div>
      </div>
    </section>
  );
}

function PasoNotas({ b, onEtiqueta, onTexto }: { b: Borrador; onEtiqueta: (t: string) => void; onTexto: (t: string) => void }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="observaciones">
      <h1 id="observaciones" className="titular-momento text-[34px]">Observaciones</h1>
      <div className="flex flex-wrap gap-1.5">
        {ETIQUETAS_NOTAS.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={b.etiquetas.includes(t)}
            onClick={() => onEtiqueta(t)}
            className={cn(
              "etiqueta min-h-10 rounded-full border border-border px-3 text-[11px] tracking-[0.08em]",
              b.etiquetas.includes(t) && "border-transparent bg-brand-lime text-ink",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <textarea
        value={b.observaciones}
        onChange={(e) => onTexto(e.target.value.slice(0, 900))}
        rows={5}
        aria-label="Observaciones"
        placeholder="El Cuervo (Portales) se lastimó el tobillo al 70', siguió jugando. Se paró 5 min por lluvia en el 2º tiempo."
        className="rounded-2xl border border-role bg-surface p-3 text-[15px] leading-snug"
      />
      <p className="text-[12px] text-muted-foreground">Opcional. Lo lee la liga cuando valida.</p>
    </section>
  );
}

function PasoResumen({
  b,
  local,
  visita,
  marcador,
  nombres,
  firmas,
  problemas,
  onEditar,
}: {
  b: Borrador;
  local: EquipoCedula;
  visita: EquipoCedula;
  marcador: { local: number; visita: number };
  nombres: Record<string, string>;
  firmas: FirmaHecha[];
  problemas: string[];
  onEditar: (p: Paso) => void;
}) {
  const tarjetas = b.eventos.filter((e) => e.tipo === "AMARILLA" || e.tipo === "ROJA");
  const filas: { etiqueta: string; texto: string; paso: Paso }[] = [
    { etiqueta: "Goles", texto: lineaDeGoles(b.eventos, nombres), paso: "goles" },
    {
      etiqueta: "Tarjetas",
      texto: tarjetas.length ? tarjetas.map((t) => `${t.tipo === "ROJA" ? "🟥" : "🟨"} ${nombres[t.jugadorId]}${t.minuto != null ? ` ${t.minuto}'` : ""}`).join(" · ") : "Sin tarjetas",
      paso: "tarjetas",
    },
    { etiqueta: "Jugaron", texto: `${local.corto} ${(b.jugaron[local.teamId] ?? []).length} · ${visita.corto} ${(b.jugaron[visita.teamId] ?? []).length}`, paso: "jugaron" },
    { etiqueta: "Notas", texto: textoObservaciones(b) || "Sin notas", paso: "notas" },
  ];
  return (
    <section className="flex flex-col gap-3" aria-label="Resumen de la cédula">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
        <div className="flex flex-col items-center gap-1">
          <Escudo {...local.colores} tamano={34} forma="escudo" />
          <span className="titular-momento text-[15px]">{local.corto}</span>
        </div>
        <span className="font-display text-[56px] leading-none font-black text-role">
          {marcador.local}–{marcador.visita}
        </span>
        <div className="flex flex-col items-center gap-1">
          <Escudo {...visita.colores} tamano={34} forma="escudo" />
          <span className="titular-momento text-[15px]">{visita.corto}</span>
        </div>
      </div>
      <dl className="flex flex-col divide-y divide-border">
        {filas.map((f) => (
          <div key={f.etiqueta} className="flex min-h-12 items-center gap-3 py-2">
            <dt className="etiqueta w-20 text-[11px] tracking-[0.12em] text-muted-foreground">{f.etiqueta}</dt>
            <dd className="flex-1 text-[14px] leading-snug">{f.texto}</dd>
            <button type="button" onClick={() => onEditar(f.paso)} aria-label={`Editar ${f.etiqueta.toLowerCase()}`} className="-mr-2 flex size-11 items-center justify-center text-muted-foreground">
              <Pencil aria-hidden className="size-4" />
            </button>
          </div>
        ))}
      </dl>
      {problemas.length > 0 && (
        <div role="alert" className="flex flex-col gap-1 rounded-2xl border border-danger/50 bg-danger/12 p-3 text-[13px] text-danger">
          <strong>Antes de mandarla:</strong>
          {problemas.map((p) => (
            <span key={p}>· {p}</span>
          ))}
        </div>
      )}
      <Sobretitulo className="text-muted-foreground">Firmas · en este celular</Sobretitulo>
      <div className="grid grid-cols-2 gap-2">
        {[local, visita].map((e) => {
          const f = firmas.find((x) => x.teamId === e.teamId);
          const quien = (f && e.delegados.find((d) => d.userId === f.firmanteId)) ?? e.delegados[0];
          return (
            <div key={e.teamId} className={cn("flex items-center gap-2 rounded-xl border border-dashed border-border p-2.5", f && "border-solid border-success")}>
              <span className="flex size-8 items-center justify-center rounded-full bg-surface-2 text-[11px] font-bold">{quien ? inicialesDe(quien.nombre) : "—"}</span>
              <span className="flex flex-col text-[13px] leading-tight">
                <strong className="font-semibold">{quien?.nombre ?? `${e.corto}: sin delegado`}</strong>
                <span className={cn("text-[11px]", f ? "text-success" : "text-muted-foreground")}>{f ? "firmó ✓" : quien ? "pendiente" : "firma la liga"}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PasoFirma({
  equipo,
  numero,
  total,
  local,
  visita,
  marcador,
  linea,
  tarjetas,
  yaFirmo,
  onFirmar,
  onDespues,
  onCorregir,
}: {
  equipo: EquipoCedula;
  numero: number;
  total: number;
  local: EquipoCedula;
  visita: EquipoCedula;
  marcador: { local: number; visita: number };
  linea: string;
  tarjetas: number;
  yaFirmo: string[];
  onFirmar: (firmanteId: string, trazo: string) => void;
  onDespues: () => void;
  onCorregir: () => void;
}) {
  const [firmante, setFirmante] = useState(equipo.delegados[0].userId);
  const [trazo, setTrazo] = useState<string | null>(null);
  const quien = equipo.delegados.find((d) => d.userId === firmante)!;
  return (
    <section className="flex flex-col gap-3" aria-labelledby="pasale">
      <div className="flex flex-col gap-1">
        <Sobretitulo className="text-role">
          Firma {numero} de {total}
        </Sobretitulo>
        <span className="h-1 rounded-full bg-surface-2">
          <span className="block h-1 rounded-full bg-role" style={{ width: `${(numero / total) * 100}%` }} />
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-role bg-surface-2 text-sm font-bold">{inicialesDe(quien.nombre)}</span>
        <div className="flex flex-col">
          <h1 id="pasale" className="titular-momento text-[28px] leading-[0.9]">
            {numero === 1 ? "Pásale el celular a" : "Ahora"} {quien.nombre}
          </h1>
          <span className="text-[13px] text-muted-foreground">Delegado de {equipo.nombre}</span>
        </div>
      </div>
      {equipo.delegados.length > 1 && (
        <Chips opciones={equipo.delegados.map((d) => d.userId)} valor={firmante} onCambio={setFirmante} etiqueta={(id) => equipo.delegados.find((d) => d.userId === id)!.nombre} />
      )}
      <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <strong className="text-[15px]">
            {local.corto} {marcador.local}–{marcador.visita} {visita.corto}
          </strong>
          <span className="etiqueta text-[11px] text-muted-foreground">
            {marcador.local + marcador.visita} {marcador.local + marcador.visita === 1 ? "gol" : "goles"} · {tarjetas} {tarjetas === 1 ? "tarjeta" : "tarjetas"}
          </span>
        </div>
        <p className="text-[13px] text-muted-foreground">{linea}</p>
        <p className="text-[12px] text-muted-foreground">
          {yaFirmo.length ? `${yaFirmo.join(" y ")} ya firmó ✓` : "Revisa el resumen antes de firmar."}
        </p>
      </div>
      <FirmaConElDedo onCambio={setTrazo} />
      <BotonLima className="w-full" disabled={!trazo} onClick={() => trazo && onFirmar(firmante, trazo)}>
        <Signature aria-hidden />
        De acuerdo · Firmar
      </BotonLima>
      <Button variant="quieto" size="cta" className="w-full border border-border" onClick={onCorregir}>
        <Flag aria-hidden />
        Pedir corrección
      </Button>
      <button type="button" onClick={onDespues} className="min-h-11 text-[13px] font-semibold text-muted-foreground underline underline-offset-4">
        No está {quien.nombre}: que firme en su celular
      </button>
    </section>
  );
}

function PasoLista({
  local,
  visita,
  marcador,
  firmas,
  porEnviar,
  enLinea,
  enviando,
  guardadoEn,
  onReintentar,
}: {
  local: EquipoCedula;
  visita: EquipoCedula;
  marcador: { local: number; visita: number };
  firmas: FirmaHecha[];
  porEnviar: boolean;
  enLinea: boolean;
  enviando: boolean;
  guardadoEn: string | null;
  onReintentar: () => void;
}) {
  const quienes = firmas.flatMap((f) => [...local.delegados, ...visita.delegados].filter((d) => d.userId === f.firmanteId).map((d) => d.nombre));
  const hora = guardadoEn ? new Date(guardadoEn).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" }) : null;
  return (
    <section className="flex flex-col items-center gap-3 pt-4 text-center" aria-labelledby="lista">
      <Chip tono={firmas.length === 2 ? "verde" : "ambar"}>
        {firmas.length === 2 ? "✓ 2 firmas" : firmas.length === 1 ? "1 firma · la otra en su celular" : "Firman en su celular"}
      </Chip>
      <h1 id="lista" className="titular-momento text-[52px]">Cédula lista</h1>
      <p className="text-[14px] text-muted-foreground">
        {local.corto} {marcador.local}–{marcador.visita} {visita.corto}
        {quienes.length ? ` · firmaron ${quienes.join(" y ")}.` : "."}
      </p>
      {!enLinea && (
        <div className="flex w-full flex-col gap-1 rounded-2xl border border-warning/50 bg-warning-soft p-3 text-left text-[13px]">
          <strong className="flex items-center gap-1.5 text-warning">
            <WifiOff aria-hidden className="size-4" />
            Sin señal en la cancha
          </strong>
          <span>Se queda guardada en este celular y se manda sola al volver la señal. Si cierras la app, se manda al abrir otra vez esta cédula.</span>
          {porEnviar && (
            <button type="button" onClick={onReintentar} disabled={enviando} className="flex min-h-11 items-center gap-1.5 font-semibold text-warning">
              <RefreshCw aria-hidden className={cn("size-4", enviando && "animate-spin")} />
              {enviando ? "Reintentando…" : "Reintentar ahora"}
              {hora && <span className="font-normal text-muted-foreground"> · guardada {hora}</span>}
            </button>
          )}
        </div>
      )}
      <div className="flex w-full items-start gap-2 rounded-2xl border border-border bg-surface p-3 text-left text-[13px]">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span>
          <strong>Después la revisa la liga.</strong> La valida y ya cuenta para la tabla y el goleo.
        </span>
      </div>
    </section>
  );
}
