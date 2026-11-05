import { Suspense } from "react";
import { Info } from "lucide-react";
import { Logo } from "@/shared/ui/logo";
import { Skeleton } from "@/shared/ui/skeleton";
import { isEnabled } from "../../server/flags";
import { MENSAJE_ERROR_ENTRADA, rutaSegura, type ErrorDeEntrada } from "../../server/services/sesion";
import { AccesoPrueba } from "./acceso-prueba";
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
      {/* En celular el formulario queda abajo, al alcance del pulgar, como en el deck */}
      <main className="flex flex-col px-4 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] lg:max-w-[600px] lg:flex-1 lg:justify-center lg:px-14">
        <Suspense fallback={<TarjetaCargando />}>
          <TarjetaEntrar parametros={parametros} />
        </Suspense>
      </main>
    </div>
  );
}

function Hero() {
  return (
    <header className="dark relative isolate flex min-h-[52dvh] flex-1 flex-col overflow-hidden bg-ink px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6 text-foreground lg:min-h-dvh lg:px-16 lg:pt-12 lg:pb-14">
      {/* Atardecer en el llano: luz dorada arriba, azul de la marca al fondo y las líneas de la cancha */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_70%_at_75%_0%,color-mix(in_oklch,var(--color-gold)_38%,transparent),transparent_62%),radial-gradient(90%_60%_at_10%_100%,color-mix(in_oklch,var(--color-brand-blue)_55%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-[repeating-linear-gradient(90deg,transparent_0_119px,color-mix(in_oklch,var(--color-brand-silver)_6%,transparent)_119px_120px)] [mask-image:linear-gradient(to_top,black,transparent)]"
      />
      <Logo tamano={44} />
      <div className="mt-auto flex flex-col gap-4 pt-10 lg:max-w-[640px]">
        <p className="etiqueta hidden items-center gap-3 text-[11px] tracking-[0.3em] text-brand-lime lg:flex">
          <span aria-hidden className="h-px w-8 bg-brand-lime" />
          La red del fútbol llanero
        </p>
        {/* Siempre en dos líneas, como el deck: "DEL LLANO A TU" / "CELULAR." */}
        <h1 className="titular-momento text-[clamp(44px,15vw,56px)] leading-[0.86] sm:text-[72px] lg:text-[68px] xl:text-[96px] 2xl:text-[112px]">
          Del llano a tu
          <br />
          <span className="text-brand-lime">celular.</span>
        </h1>
        <p className="max-w-[460px] text-[15px] leading-snug text-foreground/80 lg:text-lg">
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
  const [google, cuentasDePrueba] = await Promise.all([
    isEnabled("auth.google"),
    isEnabled("auth.demo_login"),
  ]);

  return (
    <div className="flex flex-col gap-5 lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:p-8 lg:shadow-sm">
      <div className="hidden flex-col gap-3 lg:flex">
        <h2 className="titular-momento text-[48px] leading-[0.9] text-balance">Entra con tu correo</h2>
        <p className="text-sm text-muted-foreground">
          Te mandamos un link a tu correo. Sin contraseñas que olvidar.
        </p>
      </div>

      <FormularioCorreo next={next} aviso={aviso} />

      <div className="hidden items-center gap-3 text-xs text-muted-foreground lg:flex" aria-hidden>
        <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
      </div>
      <BotonGoogle prendido={google} next={next} />
      {cuentasDePrueba && <AccesoPrueba next={next} />}

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
