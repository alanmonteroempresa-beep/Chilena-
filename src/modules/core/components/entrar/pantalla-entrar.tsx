import { Suspense } from "react";
import { Info, TriangleAlert } from "lucide-react";
import { Logo } from "@/shared/ui/logo";
import { Skeleton } from "@/shared/ui/skeleton";
import { isEnabled } from "../../server/flags";
import { MENSAJE_ERROR_ENTRADA, rutaSegura, type ErrorDeEntrada } from "../../server/services/sesion";
import { BotonGoogle } from "./boton-google";
import { FormularioCorreo } from "./formulario-correo";

type Parametros = Promise<{ next?: string | string[]; error?: string | string[] }>;

/**
 * Pantalla 01 · Entrar (docs/diseno/pantallas/01-inicio.png, con el rebrand).
 * Beta (PRD §4.1): link mágico al correo; Google con su flag; WhatsApp apagado. No se elige rol.
 * El hero va siempre oscuro (en el deck es una foto del llano); la columna del formulario sigue el tema.
 */
export function PantallaEntrar({ parametros }: { parametros: Parametros }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <Hero />
      <section className="flex flex-1 flex-col px-4 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] lg:max-w-[600px] lg:justify-center lg:px-14">
        <Suspense fallback={<TarjetaCargando />}>
          <TarjetaEntrar parametros={parametros} />
        </Suspense>
      </section>
    </div>
  );
}

function Hero() {
  return (
    <header className="dark relative isolate flex min-h-[52dvh] flex-col overflow-hidden bg-ink px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6 text-white lg:min-h-dvh lg:flex-1 lg:px-16 lg:pt-12 lg:pb-14">
      {/* Atardecer en el llano: luz dorada arriba, azul de la marca al fondo y las líneas de la cancha */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_70%_at_75%_0%,color-mix(in_oklch,var(--color-gold)_38%,transparent),transparent_62%),radial-gradient(90%_60%_at_10%_100%,color-mix(in_oklch,var(--color-brand-blue)_55%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-[repeating-linear-gradient(90deg,transparent_0_118px,color-mix(in_oklch,white_5%,transparent)_118px_120px)] [mask-image:linear-gradient(to_top,black,transparent)]"
      />
      <Logo tamano={44} />
      <div className="mt-auto flex flex-col gap-4 pt-10 lg:max-w-[640px]">
        <p className="etiqueta hidden items-center gap-3 text-[11px] tracking-[0.3em] text-brand-lime lg:flex">
          <span aria-hidden className="h-px w-8 bg-brand-lime" />
          La red del fútbol llanero
        </p>
        <h1 className="titular-momento text-[56px] leading-[0.86] sm:text-[72px] lg:text-[112px]">
          Del llano a tu <span className="text-brand-lime">celular.</span>
        </h1>
        <p className="max-w-[460px] text-[15px] leading-snug text-white/80 lg:text-lg">
          <span className="lg:hidden">Resultados, golazos y la porra de tu equipo. Gratis.</span>
          <span className="hidden lg:inline">
            Resultados al momento, cada golazo con su portada y la porra de tu equipo. Gratis y sin
            contraseñas.
          </span>
        </p>
      </div>
    </header>
  );
}

const primero = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function TarjetaEntrar({ parametros }: { parametros: Parametros }) {
  const p = await parametros;
  const next = rutaSegura(primero(p.next)) ?? undefined;
  const codigo = primero(p.error) as ErrorDeEntrada | undefined;
  const aviso = codigo && codigo in MENSAJE_ERROR_ENTRADA ? MENSAJE_ERROR_ENTRADA[codigo] : null;
  const google = await isEnabled("auth.google");

  return (
    <div className="flex flex-col gap-5 lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:p-8 lg:shadow-sm">
      <div className="hidden flex-col gap-3 lg:flex">
        <h2 className="titular-momento text-[52px] leading-[0.9]">Entra con tu correo</h2>
        <p className="text-sm text-muted-foreground">
          Te mandamos un link a tu correo. Sin contraseñas que olvidar.
        </p>
      </div>

      {aviso && (
        <p
          role="alert"
          className="flex gap-2.5 rounded-xl bg-warning-soft p-3 text-sm leading-snug font-medium text-warning"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {aviso}
        </p>
      )}

      <FormularioCorreo next={next} />

      <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
        <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
      </div>
      <BotonGoogle prendido={google} next={next} />

      <p className="hidden gap-2.5 rounded-xl border border-brand-blue/30 bg-brand-blue/10 p-4 text-[13px] leading-snug lg:flex">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-blue dark:text-brand-silver" />
        No tienes que elegir nada: si te invitó tu delegado entras directo a tu equipo, y si llegaste por un
        golazo, a seguir a ese crack.
      </p>
    </div>
  );
}

function TarjetaCargando() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}
