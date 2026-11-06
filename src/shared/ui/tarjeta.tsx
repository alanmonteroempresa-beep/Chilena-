import { cn } from "@/shared/lib/utils";

/** Tarjeta de contenido (export 03·05 claro: radio 16–18, borde #E3E8EE y sombra mínima) */
export function Tarjeta({ className, children, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(7,9,12,0.05)]", className)}
      {...props}
    >
      {children}
    </section>
  );
}

/** Tarjeta principal del inicio, con el color del rol (DISENO §2: "la tarjeta principal del inicio") */
export function TarjetaRol({ className, children, ...props }: React.ComponentProps<"section">) {
  return (
    <section className={cn("tarjeta-rol rounded-[18px] p-4 text-white", className)} {...props}>
      {children}
    </section>
  );
}

/** Título de sección: "PLANTILLA", "TABLA · LDI", "SIGUE A MÁS CRACKS" (Big Shoulders 900) */
export function TituloSeccion({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn("font-display text-[22px] leading-none font-black uppercase", className)}>{children}</h2>;
}

/** Etiqueta chica arriba de un dato: "PRÓXIMO · J16", "POR PAGAR A LA LIGA" */
export function Sobretitulo({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("etiqueta text-[11px] font-extrabold tracking-[0.16em]", className)}>{children}</span>
  );
}
