import { AccionPronto } from "@/shared/ui/accion-pronto";
import { buttonVariants } from "@/shared/ui/button";
import { Sobretitulo, TarjetaRol } from "@/shared/ui/tarjeta";

/** Mi liga sin liga (PRD §6.16: nunca vacía y triste): cómo entrar a una */
export function MiLigaVacia() {
  return (
    <main className="flex flex-col gap-3 px-4 pt-3.5 pb-6">
      <h1 className="titular-momento text-[46px] leading-[0.85]">Mi liga</h1>
      <TarjetaRol className="flex flex-col gap-2">
        <Sobretitulo className="text-white/80">Todavía sin liga</Sobretitulo>
        <p className="titular-momento text-[32px]">Únete a tu liga</p>
        <p className="text-[13px] text-white/85">
          Con el código que te pasa tu liga o tu delegado, aquí salen la tabla, el rol de juegos y el goleo.
        </p>
        <AccionPronto aviso="Unirme a una liga llega pronto" className={buttonVariants({ variant: "lima", size: "cta" })}>
          Unirme a una liga
        </AccionPronto>
      </TarjetaRol>
    </main>
  );
}
