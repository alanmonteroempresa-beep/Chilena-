/**
 * Pantalla que todavía no está (recorrido de solo lectura). Dice qué va a ser y no inventa datos.
 * docs/DISENO.md: "Un flag apagado oculta la función o la muestra como Próximamente".
 */
export function Proximamente({
  titulo,
  texto,
  Icono,
}: {
  titulo: string;
  texto: string;
  Icono?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <main className="flex flex-col gap-4 px-4 pt-6">
      <span className="etiqueta w-fit rounded-md bg-surface-2 px-2 py-1 text-[11px] tracking-[0.14em] text-muted-foreground">
        Próximamente
      </span>
      <div className="flex items-start gap-3">
        {Icono && (
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-role/15 text-role">
            <Icono aria-hidden className="size-6" />
          </span>
        )}
        <h1 className="titular-momento text-[44px] leading-[0.9]">{titulo}</h1>
      </div>
      <p className="max-w-[460px] text-[15px] leading-snug text-muted-foreground">{texto}</p>
    </main>
  );
}
