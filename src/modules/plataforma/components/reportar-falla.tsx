"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Bug, Rocket, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { BotonLima, Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/ui/sheet";
import { reportarFalla } from "../server/actions";
import { ETIQUETA_FALLA, TIPOS_DE_FALLA, type TipoDeFalla } from "../server/services/fallas";

type Enviado = { numero: number; tuyos: number; arreglados: number };

/**
 * "Reportar falla" (pantalla 42 · beta): botón flotante pequeño arriba de la barra en todas las pantallas
 * del cascarón (nunca tapa el botón central). Formulario de 10 segundos: ¿qué pasó?, el texto, la pantalla
 * donde estabas y los datos del celular (los dos se pueden quitar). Al final, un gracias de verdad.
 */
export function ReportarFalla({ rol }: { rol: string | null }) {
  const pantalla = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoDeFalla | null>(null);
  const [texto, setTexto] = useState("");
  const [conPantalla, setConPantalla] = useState(true);
  const [conCelular, setConCelular] = useState(true);
  const [enviado, setEnviado] = useState<Enviado | null>(null);
  const [pendiente, startTransition] = useTransition();

  const reiniciar = () => {
    setTipo(null);
    setTexto("");
    setEnviado(null);
  };

  const enviar = () =>
    startTransition(async () => {
      if (!tipo) return void toast.error("Elige qué pasó.");
      const r = await reportarFalla({
        tipo,
        texto,
        pantalla: conPantalla ? `${pantalla}${window.location.search}`.slice(0, 300) : null,
        dispositivo: conCelular
          ? {
              userAgent: navigator.userAgent.slice(0, 400),
              ancho: window.innerWidth,
              alto: window.innerHeight,
              instalada: window.matchMedia("(display-mode: standalone)").matches,
              rol,
            }
          : null,
      });
      if (!r.ok) return void toast.error(r.error);
      setEnviado({ numero: r.numero, tuyos: r.tuyos, arreglados: r.arreglados });
    });

  return (
    <Sheet
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v);
        if (!v) reiniciar();
      }}
    >
      <SheetTrigger className="fixed right-[max(0.75rem,env(safe-area-inset-right))] bottom-[calc(84px+env(safe-area-inset-bottom)+0.5rem)] z-30 flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface/95 px-3 text-[13px] font-semibold text-muted-foreground shadow-[0_2px_8px_rgba(7,9,12,0.18)] backdrop-blur">
        <Bug aria-hidden className="size-4" />
        Reportar falla
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90dvh] gap-0 overflow-y-auto rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        {enviado ? (
          <div className="flex flex-col items-center gap-3 px-5 pt-8 pb-4 text-center">
            <span className="grid size-20 place-items-center rounded-2xl bg-brand-lime text-ink">
              <Rocket aria-hidden className="size-10" />
            </span>
            <SheetHeader className="items-center p-0">
              <SheetDescription className="etiqueta text-[11px] tracking-[0.16em] text-muted-foreground">Reporte #{enviado.numero} recibido</SheetDescription>
              <SheetTitle className="titular-momento text-[48px] leading-[0.88]">¡Gracias, pionero!</SheetTitle>
            </SheetHeader>
            <p className="max-w-xs text-[14px] text-muted-foreground">Ya le llegó al equipo de Chilena. Con esto la arreglamos más rápido.</p>
            <div className="grid w-full grid-cols-2 gap-2">
              <span className="flex flex-col rounded-xl bg-surface-2 p-3">
                <span className="titular-momento text-[36px] leading-none text-role">{enviado.tuyos}</span>
                <span className="text-[12px] text-muted-foreground">reporte{enviado.tuyos === 1 ? "" : "s"} tuyo{enviado.tuyos === 1 ? "" : "s"}</span>
              </span>
              <span className="flex flex-col rounded-xl bg-surface-2 p-3">
                <span className="titular-momento text-[36px] leading-none text-role">{enviado.arreglados}</span>
                <span className="text-[12px] text-muted-foreground">ya arreglado{enviado.arreglados === 1 ? "" : "s"}</span>
              </span>
            </div>
            <Button variant="quieto" size="cta" className="w-full border border-border" onClick={() => setAbierto(false)}>
              Seguir
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 px-4 pt-5">
            <SheetHeader className="p-0">
              <SheetTitle className="titular-momento flex items-center gap-2 text-[34px] leading-none">
                <Bug aria-hidden className="size-6 text-role" />
                Reportar falla
              </SheetTitle>
              <SheetDescription className="text-[13px]">Dinos qué pasó. Toma 10 segundos.</SheetDescription>
            </SheetHeader>
            <fieldset className="flex flex-col gap-2">
              <legend className="etiqueta mb-2 text-[11px] tracking-[0.16em] text-muted-foreground">¿Qué pasó?</legend>
              <div className="flex flex-wrap gap-2">
                {TIPOS_DE_FALLA.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={tipo === t}
                    onClick={() => setTipo(t)}
                    className={cn(
                      "etiqueta min-h-11 rounded-full border px-3.5 text-[13px] font-extrabold tracking-[0.06em]",
                      tipo === t ? "border-transparent bg-brand-lime text-ink" : "border-border bg-surface-2",
                    )}
                  >
                    {ETIQUETA_FALLA[t]}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="flex flex-col gap-1.5">
              <span className="sr-only">Cuéntanos qué pasó</span>
              <textarea
                id="falla-texto"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={4}
                maxLength={1900}
                placeholder="Ej.: En la tabla Portales sale con 32 y ya debería llevar 35"
                className="w-full rounded-xl border border-border bg-surface p-3 text-[15px] outline-none focus-visible:border-role focus-visible:ring-3 focus-visible:ring-role/30"
              />
            </label>
            <Interruptor
              id="falla-pantalla"
              activo={conPantalla}
              onCambio={setConPantalla}
              titulo="La pantalla donde estabas"
              detalle={pantalla}
            />
            <Interruptor
              id="falla-celular"
              activo={conCelular}
              onCambio={setConCelular}
              titulo="Mandar datos del celular"
              detalle="Modelo, navegador y tamaño de pantalla"
            />
            <BotonLima className="w-full" disabled={pendiente || !tipo || texto.trim().length < 3} onClick={enviar}>
              <Send aria-hidden />
              {pendiente ? "Enviando…" : "Enviar"}
            </BotonLima>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Interruptor({
  id,
  activo,
  onCambio,
  titulo,
  detalle,
}: {
  id: string;
  activo: boolean;
  onCambio: (v: boolean) => void;
  titulo: string;
  detalle: string;
}) {
  return (
    <label htmlFor={id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl bg-surface-2 px-3 py-2">
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold">{titulo}</span>
        <span className="block truncate text-[12px] text-muted-foreground">{detalle}</span>
      </span>
      <input id={id} type="checkbox" role="switch" checked={activo} onChange={(e) => onCambio(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-border transition-colors peer-checked:bg-brand-lime peer-focus-visible:ring-3 peer-focus-visible:ring-role/40 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-ink"
      />
    </label>
  );
}
