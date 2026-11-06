import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Rol } from "@/shared/lib/roles";
import { buttonVariants } from "@/shared/ui/button";
import { Sobretitulo, TarjetaRol } from "@/shared/ui/tarjeta";

/** Completa tu perfil en el inicio (pantalla 40a, PRD §4.4): "una tarjeta en su inicio y pasos cortos" */
export function TarjetaCompletarPerfil() {
  return (
    <section className="mx-4 mt-3.5 flex flex-col gap-3 rounded-2xl bg-role-card p-4 text-white">
      <p className="titular-momento text-[30px] leading-[0.9]">Completa tu perfil</p>
      <p className="text-sm text-white/80">Nombre, apodo y foto: 30 segundos, y tu carta ya no sale en blanco.</p>
      <Link href="/perfil/completar" className={buttonVariants({ variant: "lima", size: "cta" })}>
        <ArrowRight aria-hidden />
        Completar · 2 min
      </Link>
    </section>
  );
}

/** Nunca una pantalla vacía y triste (PRD §6.16): qué verá aquí cuando tenga equipo o liga */
const VACIO: Record<Exclude<Rol, "aficionado">, { titulo: string; texto: string }> = {
  jugador: {
    titulo: "Sin equipo todavía",
    texto: "Pídele a tu delegado el link de tu equipo. Con él, aquí salen tu próximo partido, tus goles y el goleo.",
  },
  delegado: {
    titulo: "Sin equipo a tu cargo",
    texto: "Cuando tengas tu equipo, aquí ves quién va el domingo, la plantilla, las cuotas y lo que debes a la liga.",
  },
  arbitro: {
    titulo: "Sin partidos asignados",
    texto: "Cuando una liga te asigne partidos, aquí salen con su hora, cancha y lo que cobras.",
  },
  liga: {
    titulo: "Sin liga todavía",
    texto: "Cuando registres tu liga, aquí ves lo que toca revisar: cédulas, árbitros, pagos y la jornada.",
  },
};

export function InicioVacio({ rol }: { rol: Exclude<Rol, "aficionado"> }) {
  const v = VACIO[rol];
  return (
    <main className="flex flex-col gap-3 px-4 pt-3.5 pb-6">
      <TarjetaRol className="flex flex-col gap-2">
        <Sobretitulo className="text-white/80">Inicio</Sobretitulo>
        <h1 className="titular-momento text-[38px]">{v.titulo}</h1>
        <p className="text-[13px] text-white/85">{v.texto}</p>
      </TarjetaRol>
    </main>
  );
}
