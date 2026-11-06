import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, Share2 } from "lucide-react";
import { nombreVisible } from "@/shared/lib/personas";
import { cn } from "@/shared/lib/utils";
import { AccionPronto } from "@/shared/ui/accion-pronto";
import { buttonVariants } from "@/shared/ui/button";
import { coloresDe } from "@/shared/ui/escudo";
import { Sobretitulo, Tarjeta } from "@/shared/ui/tarjeta";
import { PARTIDOS_PARA_MEDIA } from "../server/formula";
import type { DatosDelJugador } from "../server/jugador";
import { CartaVolteable } from "./carta-volteable";

/** Props de `CartaCrack` a partir de los datos del jugador (frente: torneo actual; reverso: la ventana) */
export function propsDeCarta(d: DatosDelJugador) {
  const nombre = nombreVisible(d.persona);
  const portero = d.carta.grupo === "PORTERO";
  return {
    nivel: d.carta.nivel,
    media: d.carta.media,
    enConstruccion: d.carta.enConstruccion,
    posicion: d.posicion ?? d.carta.grupo.slice(0, 3),
    nombre,
    escudo: d.equipo ? coloresDe(d.equipo) : { color: "#262B33", colorFranja: "#C6D0DD" },
    zona: d.persona.alcaldia ?? undefined,
    stats: [
      { valor: d.stats?.goles ?? 0, etiqueta: "GOL" },
      { valor: d.stats?.partidos ?? 0, etiqueta: "PJ" },
      { valor: d.stats?.asistencias ?? 0, etiqueta: "AST" },
    ] as [{ valor: number; etiqueta: string }, { valor: number; etiqueta: string }, { valor: number; etiqueta: string }],
    atributos: d.carta.atributos,
    torneo: d.torneo?.nombre.toUpperCase(),
    nota: portero
      ? "Portero: VAL, SEG y PEN en lugar de DEF y PAS"
      : "CRK y RES se mueven con las votaciones: MVP y respeto de los rivales",
  };
}

/**
 * La carta en detalle (pantallas 25a y 25b): frente y reverso, los números del portero y la carta en
 * construcción. Todo sale de la cédula del árbitro y de las votaciones: nadie se pone su propia media.
 */
export function PaginaCarta({ d, esPropio }: { d: DatosDelJugador; esPropio: boolean }) {
  const nombre = nombreVisible(d.persona);
  const v = d.ventana;
  return (
    <main className="flex flex-col gap-4 px-4 pt-3 pb-6">
      <div className="flex min-h-11 items-center gap-2">
        <Link
          href={`/j/${d.persona.username}`}
          aria-label={`Volver al perfil de ${nombre}`}
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-lg"
        >
          <ArrowLeft aria-hidden className="size-5" />
        </Link>
        <h1 className="etiqueta flex-1 truncate text-sm font-extrabold tracking-[0.16em]">
          {esPropio ? "Mi carta" : `Carta de ${nombre}`}
        </h1>
      </div>

      <CartaVolteable carta={propsDeCarta(d)} />

      {d.carta.enConstruccion ? (
        <section className="flex flex-col gap-2">
          <p className="titular-momento text-[30px] leading-[0.92]">
            {esPropio ? "Tu media aparece" : "Su media aparece"} después de {esPropio ? "tu" : "su"}{" "}
            <span className="text-role">{PARTIDOS_PARA_MEDIA}er partido</span>
          </p>
          <div className="flex gap-1.5" aria-hidden>
            {Array.from({ length: PARTIDOS_PARA_MEDIA }, (_, i) => (
              <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < d.carta.partidosValidados ? "bg-brand-lime" : "bg-surface-2")} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {d.carta.partidosValidados} de {PARTIDOS_PARA_MEDIA} partidos validados
          </p>
        </section>
      ) : (
        d.carta.grupo === "PORTERO" && (
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                [v.vallasInvictas, "VAL", "vallas invictas"],
                [v.jugados ? (v.golesRecibidos / v.jugados).toFixed(1) : "0", "SEG", "goles en contra por partido"],
                [v.penalesAtajados, "PEN", "penales atajados"],
              ] as const
            ).map(([valor, clave, texto]) => (
              <Tarjeta key={clave} className="flex flex-col items-center gap-0.5 p-3 text-center">
                <span className="font-display text-[30px] leading-none font-black">{valor}</span>
                <span className="etiqueta text-xs font-extrabold tracking-[0.14em]">{clave}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">{texto}</span>
              </Tarjeta>
            ))}
          </div>
        )
      )}

      <div className="flex gap-2">
        <AccionPronto className={buttonVariants({ variant: "lima", size: "cta", className: "flex-1 px-3" })}>
          <Share2 aria-hidden />
          Compartir
        </AccionPronto>
        <AccionPronto
          className="etiqueta inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-extrabold tracking-[0.14em]"
        >
          <ArrowLeftRight aria-hidden className="size-4" />
          Comparar con…
        </AccionPronto>
      </div>

      <Tarjeta className="flex flex-col gap-1 p-3.5">
        <Sobretitulo className="text-role">Cómo se calcula</Sobretitulo>
        <p className="text-sm">Todo sale de la cédula del árbitro y de las votaciones. Nadie se pone su propia media.</p>
        <p className="text-xs text-muted-foreground">
          {v.convocados
            ? `Últimos ${v.convocados} partidos validados de su equipo · jugó ${v.jugados}.`
            : "Todavía no hay partidos validados."}
        </p>
      </Tarjeta>
    </main>
  );
}
