import { WifiOff } from "lucide-react";
import { BotonReintentar } from "./boton-reintentar";

/**
 * Sin conexión (pantalla 08b). La guarda el service worker (`public/sw.js`) y la enseña cuando una página no
 * carga sin señal. Estática: sin datos de nadie. La cédula del árbitro se sigue capturando en su pantalla
 * (se guarda en el celular y se sube sola al volver la señal).
 */
export function SinConexion() {
  return (
    <main className="flex min-h-dvh flex-col gap-6 bg-background px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[max(env(safe-area-inset-bottom),1.25rem)]">
      <p role="status" className="flex items-center gap-2 rounded-xl bg-warning-soft px-3 py-2 text-[13px] font-semibold text-warning">
        <WifiOff aria-hidden className="size-4 shrink-0" />
        Sin conexión · lo que captures se guarda aquí
      </p>
      <div className="flex flex-1 flex-col justify-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-warning-soft text-warning">
          <WifiOff aria-hidden className="size-7" />
        </span>
        <h1 className="titular-momento text-[52px] leading-[0.88]">
          Se fue la señal <span className="text-brand-blue dark:text-brand-lime">en la cancha.</span>
        </h1>
        <p className="max-w-md text-[15px] text-muted-foreground">
          Tranquilo: lo que ya capturaste está a salvo en tu celular y se sube solito en cuanto regrese la conexión.
        </p>
      </div>
      <BotonReintentar />
    </main>
  );
}
