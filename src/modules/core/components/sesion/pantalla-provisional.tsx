import Link from "next/link";
import { Suspense } from "react";
import { Award, ChevronRight, IdCard, Smartphone, UserRound } from "lucide-react";
import { ETIQUETA_ROL, rolDesdeRoleType, type Rol } from "@/shared/lib/roles";
import { buttonVariants } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { BotonSalir } from "./boton-salir";
import { getCurrentUser } from "../../server/auth";

type Variante = "completar" | "perfil";

const TEXTOS: Record<Variante, { titulo: string; cuerpo: string }> = {
  completar: {
    titulo: "Completa tu perfil",
    cuerpo: "Registro en 30 segundos: nombre, apodo y foto. Esta pantalla llega en la siguiente fase de la beta.",
  },
  perfil: {
    titulo: "Tu perfil",
    cuerpo: "Tu perfil público, tu carta y tus insignias. Los ajustes llegan con su pantalla (41).",
  },
};

/**
 * PROVISIONAL: /perfil (hasta el menú de la pantalla 07) y /perfil/completar (hasta la pantalla 40).
 * Confirma con quién entraste y tus roles, lleva a tu perfil público y deja salir. Va dentro del cascarón.
 */
/** `avisos`: el control "Activar avisos" de `notificaciones`, que compone la página (core no depende de él) */
export function PantallaProvisional({ variante, avisos }: { variante: Variante; avisos?: React.ReactNode }) {
  const t = TEXTOS[variante];
  return (
    <main className="flex flex-col gap-6 px-4 pt-4 pb-6">
      <div className="flex flex-col gap-3">
        <h1 className="titular-momento text-[48px] leading-[0.9]">{t.titulo}</h1>
        <p className="max-w-[440px] text-[15px] leading-snug text-muted-foreground">{t.cuerpo}</p>
      </div>
      <Suspense fallback={<Skeleton className="h-24 w-full max-w-[440px] rounded-xl" />}>
        <QuienEntro variante={variante} avisos={avisos} />
      </Suspense>
    </main>
  );
}

async function QuienEntro({ variante, avisos }: { variante: Variante; avisos?: React.ReactNode }) {
  // src/proxy.ts ya manda a /entrar a quien no tiene sesión; aquí no se redirige dentro del Suspense
  const usuario = await getCurrentUser();
  if (!usuario) {
    return (
      <Link href="/entrar" className={buttonVariants({ variant: "lima", size: "cta", className: "max-w-[440px]" })}>
        Entrar
      </Link>
    );
  }
  const nombre = usuario.sobrenombre || usuario.nombre || "crack";
  const activo = rolDesdeRoleType(usuario.activeRole);
  const roles = usuario.roles.map((r) => rolDesdeRoleType(r.role)).filter((r): r is Rol => r !== null);
  return (
    <div className="flex max-w-[440px] flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
        <p>
          Entraste como <strong className="font-semibold">{nombre}</strong>{" "}
          <span className="text-muted-foreground">(@{usuario.username})</span>
        </p>
        {activo && (
          <p className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground">Rol:</span>
            <span
              data-role={activo}
              className="etiqueta rounded-md bg-role/15 px-2 py-0.5 text-[11px] tracking-[0.12em] text-role"
            >
              {ETIQUETA_ROL[activo]}
            </span>
            {roles.length > 1 && (
              <span className="text-muted-foreground">
                · también{" "}
                {roles
                  .filter((r) => r !== activo)
                  .map((r) => ETIQUETA_ROL[r])
                  .join(", ")}
              </span>
            )}
          </p>
        )}
      </div>
      {variante === "perfil" && avisos}
      {variante === "perfil" && (
        <nav aria-label="Tu perfil" className="flex flex-col divide-y divide-border rounded-xl bg-surface">
          {(
            [
              [`/j/${usuario.username}`, "Mi perfil público", UserRound],
              [`/j/${usuario.username}/carta`, "Mi carta", IdCard],
              [`/j/${usuario.username}/insignias`, "Mis insignias", Award],
              ["/instalar", "Instala la app", Smartphone],
            ] as const
          ).map(([href, texto, Icono]) => (
            <Link key={href} href={href} className="flex min-h-12 items-center gap-3 px-4 text-[15px] font-semibold">
              <Icono aria-hidden className="size-5 text-role" />
              <span className="flex-1">{texto}</span>
              <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </nav>
      )}
      {variante === "completar" && (
        <Link href="/inicio" className={buttonVariants({ variant: "lima", size: "cta" })}>
          Ir a mi inicio
        </Link>
      )}
      <BotonSalir />
    </div>
  );
}
