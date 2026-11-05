import Image from "next/image";
import { Lock } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Escudo, type ColoresEquipo } from "@/shared/ui/escudo";

/**
 * Carta de crack (estática) — docs/DISENO.md §4 · docs/diseno/html/Carta Crack.dc.html · pantallas 25, 25b.
 * Medidas del export: 260×368 (2:3). Con `ancho` se escala entera con `zoom`.
 * El nivel lo decide el módulo `carta` (docs/CARTA_E_INSIGNIAS.md); aquí solo se pinta.
 */
export type NivelCarta = "bronce" | "plata" | "oro" | "leyenda" | "especial";

type Material = {
  borde: string;
  fondo: string;
  tinta: string;
  difuminado: string;
  pista: string;
  etiqueta: string;
};

export const MATERIAL_CARTA: Record<NivelCarta, Material> = {
  bronce: {
    borde: "#5E3A20",
    fondo: "linear-gradient(160deg,#E7B386,#B87645 45%,#7A4A28)",
    tinta: "#2A1608",
    difuminado: "rgba(160,100,58,.95)",
    pista: "rgba(42,22,8,.2)",
    etiqueta: "BRONCE",
  },
  plata: {
    borde: "#7D899A",
    fondo: "linear-gradient(160deg,#FFFFFF,#C6D0DD 45%,#8E9AAB)",
    tinta: "#0B1626",
    difuminado: "rgba(184,194,208,.95)",
    pista: "rgba(11,22,38,.18)",
    etiqueta: "PLATA",
  },
  oro: {
    borde: "#8C6A22",
    fondo: "linear-gradient(160deg,#FFF1C2,#E8C46A 45%,#B8913A)",
    tinta: "#2A1E05",
    difuminado: "rgba(222,184,94,.95)",
    pista: "rgba(42,30,5,.2)",
    etiqueta: "ORO",
  },
  leyenda: {
    borde: "#D0FF41",
    fondo: "linear-gradient(160deg,#222B3A,#07090C 62%)",
    tinta: "#F4F7FA",
    difuminado: "rgba(14,18,25,.95)",
    pista: "rgba(244,247,250,.18)",
    etiqueta: "LEYENDA DEL BARRIO",
  },
  especial: {
    borde: "#D0FF41",
    fondo: "linear-gradient(160deg,#0A63D6,#0250B0 55%,#023B83)",
    tinta: "#FFFFFF",
    difuminado: "rgba(2,74,163,.95)",
    pista: "rgba(255,255,255,.22)",
    etiqueta: "ONCE DE LA JORNADA",
  },
};

const FORMA =
  "polygon(0 5%,8% 0,38% 0,43% 2.6%,57% 2.6%,62% 0,92% 0,100% 5%,100% 95%,92% 100%,8% 100%,0 95%)";
const ANCHO_BASE = 260;
const ALTO_BASE = 368;

export type StatCarta = { valor: number | string; etiqueta: string };
export type AtributoCarta = { clave: string; nombre: string; valor: number };

type CartaCrackProps = {
  nivel: NivelCarta;
  lado?: "frente" | "reverso";
  /** Media de 40 a 99. Se oculta si la carta está en construcción. */
  media?: number | null;
  /** Hasta el 3er partido no hay media (docs/CARTA_E_INSIGNIAS.md) */
  enConstruccion?: boolean;
  /** POR, DFC, LAT, MCD, MC, MCO, EXT, DC */
  posicion: string;
  nombre: string;
  escudo: ColoresEquipo;
  /** Alcaldía o zona bajo el escudo */
  zona?: string;
  /** Foto de perfil (WebP ya comprimida a 512 px). Sin foto se muestran las iniciales. */
  fotoUrl?: string | null;
  /** Las 3 stats del frente: GOL · PJ · AST */
  stats: [StatCarta, StatCarta, StatCarta];
  /** Reverso: atributos con barra (DEF, PAS, CON, DIS, CRK, RES) */
  atributos?: AtributoCarta[];
  /** Reverso: torneo junto a la posición ("APERTURA 2026") */
  torneo?: string;
  /** Reverso: nota al pie */
  nota?: string;
  /** Ancho en px (la carta guarda su proporción) */
  ancho?: number;
  className?: string;
};

function iniciales(nombre: string) {
  const palabras = nombre
    .replace(/^(EL|LA|LOS|LAS)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  return palabras
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function CartaCrack({
  nivel,
  lado = "frente",
  media,
  enConstruccion = false,
  posicion,
  nombre,
  escudo,
  zona,
  fotoUrl,
  stats,
  atributos = [],
  torneo,
  nota,
  ancho = ANCHO_BASE,
  className,
}: CartaCrackProps) {
  const m = MATERIAL_CARTA[nivel];
  const mostrarMedia = !enConstruccion && media != null;
  const etiquetaAccesible = enConstruccion
    ? `Carta de ${nombre}, ${posicion}, en construcción`
    : `Carta de ${nombre}, ${posicion}, media ${media ?? "sin calcular"}, nivel ${m.etiqueta.toLowerCase()}`;

  return (
    <div
      role="img"
      aria-label={etiquetaAccesible}
      className={cn("relative shrink-0 select-none", className)}
      style={{ width: ancho, height: (ancho * ALTO_BASE) / ANCHO_BASE }}
    >
      <div
        className="relative drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]"
        style={{ width: ANCHO_BASE, height: ALTO_BASE, zoom: ancho / ANCHO_BASE }}
      >
        <div className="absolute inset-0" style={{ clipPath: FORMA, background: m.borde }} />
        <div
          className="absolute inset-1 overflow-hidden"
          style={{ clipPath: FORMA, background: m.fondo, color: m.tinta }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(115deg,rgba(255,255,255,.07) 0 2px,transparent 2px 14px)",
            }}
          />

          {lado === "frente" ? (
            <>
              {/* Foto recortada */}
              <div className="absolute top-6 right-1.5 h-[196px] w-[176px] overflow-hidden">
                {fotoUrl ? (
                  // Avatar ya optimizado en el cliente (512 px, WebP): sin optimizador de Vercel
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoUrl} alt="" className="size-full object-cover object-top" />
                ) : (
                  <div
                    aria-hidden
                    className="flex size-full items-center justify-center font-display text-[88px] font-black italic opacity-25"
                  >
                    {iniciales(nombre)}
                  </div>
                )}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[60px]"
                  style={{ background: `linear-gradient(0deg,${m.difuminado},rgba(0,0,0,0))` }}
                />
              </div>

              {/* Columna izquierda: media, posición, escudo, zona */}
              <div className="absolute top-6 left-[18px] flex w-14 flex-col items-center gap-1.5">
                {mostrarMedia && (
                  <span className="font-display text-[58px] leading-[0.78] font-black tabular-nums">
                    {media}
                  </span>
                )}
                {enConstruccion && (
                  <span
                    className="box-border flex h-[46px] w-[52px] items-center justify-center rounded-[10px] border-2 border-dashed"
                    style={{ borderColor: m.tinta }}
                  >
                    <Lock aria-hidden className="size-6" />
                  </span>
                )}
                <span className="font-display text-[22px] leading-none font-black">{posicion}</span>
                <span className="h-[1.5px] w-[30px] opacity-40" style={{ background: m.tinta }} />
                <span className="rounded-[6px_6px_14px_14px]" style={{ boxShadow: `0 0 0 1.5px ${m.tinta}` }}>
                  <Escudo {...escudo} tamano={30} forma="escudo" />
                </span>
                {zona && (
                  <span className="font-condensed text-[8.5px] font-extrabold tracking-[0.06em] whitespace-nowrap uppercase">
                    {zona}
                  </span>
                )}
              </div>

              <div className="absolute inset-x-0 top-[222px] text-center font-display text-[34px] leading-none font-black tracking-[0.01em] whitespace-nowrap uppercase italic">
                {nombre}
              </div>
              <div
                className="absolute inset-x-6 top-[264px] h-[1.5px] opacity-30"
                style={{ background: m.tinta }}
              />
              <div className="absolute inset-x-[18px] top-[274px] grid grid-cols-3 text-center">
                {stats.map((s) => (
                  <div key={s.etiqueta} className="flex flex-col items-center gap-0.5">
                    <span className="font-display text-[30px] leading-[0.9] font-black tabular-nums">
                      {s.valor}
                    </span>
                    <span className="font-condensed text-[11px] font-extrabold tracking-[0.16em]">
                      {s.etiqueta}
                    </span>
                  </div>
                ))}
              </div>

              {enConstruccion && (
                <div
                  aria-hidden
                  className="absolute -inset-x-[30px] top-[150px] flex h-[34px] -rotate-[14deg] items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
                  style={{ background: "repeating-linear-gradient(135deg,#D0FF41 0 16px,#07090C 16px 32px)" }}
                >
                  <span className="bg-ink px-2.5 py-[3px] font-condensed text-[13px] font-extrabold tracking-[0.16em] text-brand-lime">
                    CARTA EN CONSTRUCCIÓN
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="absolute inset-x-5 top-6 flex items-center gap-2.5">
                <span className="font-display text-[40px] leading-[0.8] font-black tabular-nums">
                  {mostrarMedia ? media : "–"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[22px] leading-[0.9] font-black whitespace-nowrap uppercase italic">
                    {nombre}
                  </div>
                  <div className="mt-[3px] font-condensed text-[10px] font-extrabold tracking-[0.16em] uppercase">
                    {torneo ? `${posicion} · ${torneo}` : posicion}
                  </div>
                </div>
                <span className="rounded-[5px_5px_11px_11px]" style={{ boxShadow: `0 0 0 1.5px ${m.tinta}` }}>
                  <Escudo {...escudo} tamano={24} forma="escudo" conSiglas={false} />
                </span>
              </div>
              <div
                className="absolute inset-x-5 top-[74px] h-[1.5px] opacity-30"
                style={{ background: m.tinta }}
              />
              <div className="absolute inset-x-5 top-[86px] grid grid-cols-2 gap-x-4 gap-y-3.5">
                {atributos.map((a) => (
                  <div key={a.clave} className="flex flex-col gap-[3px]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-[36px] leading-[0.85] font-black tabular-nums">
                        {a.valor}
                      </span>
                      <span className="font-display text-[17px] font-black">{a.clave}</span>
                    </div>
                    <span className="font-condensed text-[10.5px] leading-[1.1] font-bold tracking-[0.06em] whitespace-nowrap uppercase">
                      {a.nombre}
                    </span>
                    <div className="h-1 overflow-hidden rounded-[2px]" style={{ background: m.pista }}>
                      <div
                        className="h-full rounded-[2px]"
                        style={{ width: `${Math.max(0, Math.min(100, a.valor))}%`, background: m.tinta }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {nota && (
                <div className="absolute inset-x-5 bottom-9 text-center text-[11px] leading-[1.3] font-semibold">
                  {nota}
                </div>
              )}
            </>
          )}

          {/* Pie: logo + nivel */}
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
            <Image src="/brand/logo-claro.png" alt="" width={20} height={20} className="rounded-full" />
            <span className="font-condensed text-[10px] font-extrabold tracking-[0.2em]">{m.etiqueta}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
