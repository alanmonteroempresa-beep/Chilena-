import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ETIQUETA_ROL, type Rol } from "@/shared/lib/roles";
import { buttonVariants } from "@/shared/ui/button";

/** Lo que trae el inicio de cada rol (se llena en el bloque 2 del recorrido) */
const QUE_TRAE: Record<Rol, { pantalla: string; texto: string }> = {
  jugador: { pantalla: "03", texto: "Tu próximo partido, tu carta y cómo va tu equipo." },
  delegado: { pantalla: "04", texto: "Tu equipo: pase de lista, plantilla y cuotas." },
  aficionado: { pantalla: "05", texto: "La porra de tus equipos y los resultados de la jornada." },
  arbitro: { pantalla: "02", texto: "Tus partidos de hoy y la cédula." },
  liga: { pantalla: "18", texto: "El resumen de tu liga: jornada, cédulas, pagos y sanciones." },
};

/**
 * PROVISIONAL (bloque 1): inicio por rol mientras llegan las pantallas 02, 03, 04, 05 y 18.
 * Si falta nombre o apodo, la tarjeta de la pantalla 40a invita a completar el perfil.
 */
export function InicioProvisional({
  rol,
  contexto,
  sinContexto,
  completarPerfil,
}: {
  rol: Rol;
  contexto?: string;
  sinContexto?: string;
  completarPerfil: boolean;
}) {
  const q = QUE_TRAE[rol];
  return (
    <main className="flex flex-col gap-5 px-4 pt-4">
      {completarPerfil && (
        <section className="flex flex-col gap-3 rounded-2xl bg-role-card p-4 text-white">
          <p className="titular-momento text-[30px] leading-[0.9]">Completa tu perfil</p>
          <p className="text-sm text-white/80">Nombre, apodo y foto: 30 segundos, y tu carta ya no sale en blanco.</p>
          <Link href="/perfil/completar" className={buttonVariants({ variant: "lima", size: "cta" })}>
            <ArrowRight aria-hidden />
            Completar · 2 min
          </Link>
        </section>
      )}
      <div className="flex flex-col gap-2">
        <span className="etiqueta text-[11px] font-extrabold tracking-[0.16em] text-role">
          Inicio · {ETIQUETA_ROL[rol]}
          {contexto ? ` · ${contexto}` : ""}
        </span>
        <h1 className="titular-momento text-[44px] leading-[0.9]">{sinContexto ?? q.texto}</h1>
        <p className="text-sm text-muted-foreground">
          Pantalla {q.pantalla} · llega en el bloque 2 del recorrido.
        </p>
      </div>
    </main>
  );
}
