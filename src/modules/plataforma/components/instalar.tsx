"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Download, EllipsisVertical, Share, SquarePlus, Smartphone } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { BotonLima, buttonVariants } from "@/shared/ui/button";
import { Sobretitulo } from "@/shared/ui/tarjeta";

type Celular = "iphone" | "android" | "otro";

/** El evento que Chrome en Android manda cuando la app se puede instalar directo */
type AvisoDeInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const sinSuscripcion = () => () => {};
const celularDe = (ua: string): Celular => (/iPhone|iPad|iPod/i.test(ua) ? "iphone" : /Android/i.test(ua) ? "android" : "otro");

const PASOS: Record<Exclude<Celular, "otro">, { titulo: string; detalle: string; Icono: typeof Share }[]> = {
  iphone: [
    { titulo: "Toca Compartir", detalle: "El cuadrito con flecha, abajo en Safari", Icono: Share },
    { titulo: "Baja y toca “Agregar a inicio”", detalle: "Está en la lista, abajo de Copiar", Icono: SquarePlus },
    { titulo: "Toca “Agregar” arriba a la derecha", detalle: "Ya queda el ícono de Chilena", Icono: Check },
  ],
  android: [
    { titulo: "Toca el menú ⋮", detalle: "Arriba a la derecha en Chrome", Icono: EllipsisVertical },
    { titulo: "Toca “Instalar app”", detalle: "O “Agregar a pantalla principal”", Icono: Smartphone },
    { titulo: "Confirma “Instalar”", detalle: "Aparece en tus apps como cualquier otra", Icono: Check },
  ],
};

/**
 * Instala la app (pantalla 43): guía corta para iPhone o Android, sin tienda de apps. Detecta el celular y
 * muestra solo su guía; en Android, si se puede, el botón instala directo. Si ya está instalada, lo dice.
 */
export function Instalar() {
  const celular = useSyncExternalStore<Celular | null>(sinSuscripcion, () => celularDe(navigator.userAgent), () => null);
  const instalada = useSyncExternalStore(
    sinSuscripcion,
    () => window.matchMedia("(display-mode: standalone)").matches,
    () => false,
  );
  const [aviso, setAviso] = useState<AvisoDeInstalar | null>(null);
  const [lista, setLista] = useState(false);

  useEffect(() => {
    const guardar = (e: Event) => {
      e.preventDefault();
      setAviso(e as AvisoDeInstalar);
    };
    const instalo = () => setLista(true);
    window.addEventListener("beforeinstallprompt", guardar);
    window.addEventListener("appinstalled", instalo);
    return () => {
      window.removeEventListener("beforeinstallprompt", guardar);
      window.removeEventListener("appinstalled", instalo);
    };
  }, []);

  if (instalada || lista)
    return (
      <div className="flex flex-col gap-3">
        <h1 className="titular-momento text-[44px] leading-[0.9]">Ya la tienes</h1>
        <p className="text-[15px] text-muted-foreground">Chilena ya está en tu pantalla de inicio. Ábrela desde ahí, como cualquier app.</p>
        <Link href="/inicio" className={buttonVariants({ variant: "lima", size: "cta", className: "w-full" })}>
          Ir a mi inicio
        </Link>
      </div>
    );

  const guia: Exclude<Celular, "otro"> = celular === "iphone" ? "iphone" : "android";
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Sobretitulo className="text-role">Instalar en {guia === "iphone" ? "iPhone" : "Android"}</Sobretitulo>
        <h1 className="titular-momento text-[44px] leading-[0.9]">3 toques y listo</h1>
        <p className="text-[14px] text-muted-foreground">Sin tienda de apps: pesa menos que una foto y te avisamos cuando te toque jugar.</p>
      </div>

      {aviso && (
        <BotonLima
          className="w-full"
          onClick={async () => {
            await aviso.prompt();
            const { outcome } = await aviso.userChoice;
            if (outcome === "accepted") setLista(true);
            setAviso(null);
          }}
        >
          <Download aria-hidden />
          Instalar Chilena
        </BotonLima>
      )}

      <ol className="flex flex-col gap-4">
        {PASOS[guia].map((p, i) => (
          <li key={p.titulo} className="flex gap-3">
            <span className="font-display grid size-8 shrink-0 place-items-center rounded-full bg-brand-lime text-[18px] font-black italic text-ink">
              {i + 1}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="font-semibold">{p.titulo}</span>
              <span className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-muted-foreground">
                <p.Icono aria-hidden className="size-4 shrink-0" />
                {p.detalle}
              </span>
            </span>
          </li>
        ))}
      </ol>

      {celular === "otro" && (
        <p className={cn("text-[13px] text-muted-foreground")}>
          Ábrela desde tu celular para instalarla. En iPhone usa Safari; en Android, Chrome.
        </p>
      )}
      <Link href="/inicio" className="etiqueta mx-auto min-h-11 px-4 py-3 text-[13px] tracking-[0.14em] text-muted-foreground">
        Ahorita no
      </Link>
    </div>
  );
}
