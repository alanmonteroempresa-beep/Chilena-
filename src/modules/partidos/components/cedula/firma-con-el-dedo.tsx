"use client";

import { useRef, useState } from "react";
import { Eraser } from "lucide-react";

const ANCHO = 300;
const ALTO = 120;
const MAXIMO = 19_000;

/**
 * Firma con el dedo (pantalla 56b). Guarda el trazo como un path SVG sencillo ("M x y L x y …") con
 * números enteros, que es lo único que acepta el servidor.
 */
export function FirmaConElDedo({ onCambio }: { onCambio: (trazo: string | null) => void }) {
  const [trazo, setTrazo] = useState("");
  const actual = useRef("");
  const dibujando = useRef(false);
  const ultimo = useRef<[number, number] | null>(null);

  function punto(e: React.PointerEvent<SVGSVGElement>): [number, number] {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * ANCHO);
    const y = Math.round(((e.clientY - r.top) / r.height) * ALTO);
    return [Math.min(ANCHO, Math.max(0, x)), Math.min(ALTO, Math.max(0, y))];
  }
  function agregar(cmd: "M" | "L", [x, y]: [number, number]) {
    if (actual.current.length > MAXIMO) return;
    actual.current = `${actual.current}${actual.current ? " " : ""}${cmd}${x} ${y}`;
    setTrazo(actual.current);
    if (cmd === "L") onCambio(actual.current);
    ultimo.current = [x, y];
  }

  return (
    <div className="flex flex-col gap-1.5">
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        role="img"
        aria-label="Firma aquí con el dedo"
        className="h-40 w-full touch-none rounded-2xl border border-border bg-surface text-foreground"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dibujando.current = true;
          agregar("M", punto(e));
        }}
        onPointerMove={(e) => {
          if (!dibujando.current) return;
          const p = punto(e);
          const u = ultimo.current;
          if (u && Math.abs(u[0] - p[0]) + Math.abs(u[1] - p[1]) < 2) return;
          agregar("L", p);
        }}
        onPointerUp={() => (dibujando.current = false)}
        onPointerCancel={() => (dibujando.current = false)}
      >
        <line x1="16" x2={ANCHO - 16} y1={ALTO - 26} y2={ALTO - 26} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="4 4" />
        <text x="16" y={ALTO - 10} fontSize="10" fill="currentColor" fillOpacity="0.55">
          Firma aquí con el dedo
        </text>
        <path d={trazo || "M0 0"} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <button
        type="button"
        onClick={() => {
          actual.current = "";
          setTrazo("");
          onCambio(null);
        }}
        className="flex min-h-11 items-center gap-1.5 self-end px-2 text-[13px] font-semibold text-muted-foreground"
      >
        <Eraser aria-hidden className="size-4" />
        Borrar firma
      </button>
    </div>
  );
}
