import { Check } from "lucide-react";
import type { Respuesta } from "@/modules/equipos";
import { cn } from "@/shared/lib/utils";
import { AccionPronto } from "@/shared/ui/accion-pronto";
import { buttonVariants } from "@/shared/ui/button";
import { coloresDe, Escudo } from "@/shared/ui/escudo";
import { Sobretitulo, TarjetaRol } from "@/shared/ui/tarjeta";

type Equipo = { siglas: string | null; colorPrimario: string | null; colorSecundario: string | null; nombre: string };

export type ProximoPartido = {
  jornada: number | null;
  horario: string;
  cuando: string;
  cuenta: { dias: number; horas: number };
  local: Equipo;
  visita: Equipo;
  miRespuesta: Respuesta | null;
  van: number;
  convocados: number;
};

const dosDigitos = (n: number) => String(n).padStart(2, "0");
const ARO_BLANCO = "shadow-[0_0_0_2px_rgba(255,255,255,0.85)]";

/**
 * "TE TOCA EL DOMINGO" (pantalla 03 · export 03 claro): cuenta regresiva y "¿vas?". Solo lectura: los botones
 * muestran lo que ya contestó y avisan que confirmar llega pronto.
 */
export function TarjetaProximoPartido({ p, conPaseDeLista = true }: { p: ProximoPartido; conPaseDeLista?: boolean }) {
  const va = p.miRespuesta === "VA";
  const noVa = p.miRespuesta === "NO_VA" || p.miRespuesta === "LESIONADO";
  return (
    <TarjetaRol className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Sobretitulo>Próximo{p.jornada ? ` · J${p.jornada}` : ""}</Sobretitulo>
        <span className="text-xs text-white/75">{p.horario}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <h1 className="titular-momento text-[46px] leading-[0.82]">
          Te toca
          <br />
          <span className="whitespace-nowrap text-brand-lime">{p.cuando}</span>
        </h1>
        <div className="flex items-center gap-1.5 pb-1">
          <span className="sr-only">
            {p.local.nombre} contra {p.visita.nombre}
          </span>
          {/* Aro blanco: el escudo azul de Portales no se pierde sobre la tarjeta azul (export 03 claro) */}
          <Escudo {...coloresDe(p.local)} tamano={30} conSiglas={false} contorno={false} className={ARO_BLANCO} />
          <span className="font-display text-sm font-black">VS</span>
          <Escudo {...coloresDe(p.visita)} tamano={30} conSiglas={false} contorno={false} className={ARO_BLANCO} />
        </div>
      </div>
      <div className="flex gap-2">
        {(
          [
            [p.cuenta.dias, "Días"],
            [p.cuenta.horas, "Horas"],
          ] as const
        ).map(([n, etiqueta]) => (
          <div key={etiqueta} className="flex h-[52px] flex-1 flex-col items-center justify-center rounded-xl bg-white/14">
            <b className="font-display text-[28px] leading-none">{dosDigitos(n)}</b>
            <span className="etiqueta text-[10px] tracking-[0.16em]">{etiqueta}</span>
          </div>
        ))}
      </div>
      {conPaseDeLista && (
        <>
          <div className="flex gap-2">
            <AccionPronto
              aria-pressed={va}
              className={buttonVariants({ variant: "lima", size: "cta", className: "h-11 flex-1 px-3" })}
            >
              {va && <Check aria-hidden />}
              {va ? "Ya confirmaste" : "Confirmo que voy"}
            </AccionPronto>
            <AccionPronto
              aria-pressed={noVa}
              className={cn(
                "etiqueta inline-flex h-11 items-center gap-1.5 rounded-xl border-[1.5px] px-3.5 text-sm font-extrabold tracking-[0.14em] uppercase",
                noVa ? "border-white bg-white text-ink" : "border-white/50 text-white",
              )}
            >
              {noVa && <Check aria-hidden className="size-4" />}
              No voy
            </AccionPronto>
          </div>
          <span className="text-xs text-white/75">
            {p.van}/{p.convocados} ya confirmaron
          </span>
        </>
      )}
    </TarjetaRol>
  );
}
