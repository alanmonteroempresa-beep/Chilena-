"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { buttonVariants } from "@/shared/ui/button";
import { salir } from "../../server/actions";

/**
 * Apaga los avisos de ESTE celular antes de cerrar sesión: en un celular prestado no le deben seguir llegando
 * los avisos de otra persona. Es la API del navegador (sin importar `notificaciones`); el siguiente push a esa
 * suscripción da 410 y se borra sola.
 */
async function apagarAvisosDelCelular() {
  try {
    if (!("serviceWorker" in navigator)) return;
    const quitar = async () => {
      const r = await navigator.serviceWorker.getRegistration("/");
      const s = await r?.pushManager?.getSubscription();
      await s?.unsubscribe();
    };
    await Promise.race([quitar(), new Promise((ok) => setTimeout(ok, 2000))]);
  } catch {
    // Si el navegador no deja, se sale igual
  }
}

/** "Salir" (perfil): apaga los avisos de este celular y cierra la sesión */
export function BotonSalir() {
  const [pendiente, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pendiente}
      onClick={() =>
        startTransition(async () => {
          await apagarAvisosDelCelular();
          await salir();
        })
      }
      className={buttonVariants({ variant: "quieto", size: "cta", className: "w-full border border-border" })}
    >
      <LogOut aria-hidden />
      {pendiente ? "Saliendo…" : "Salir"}
    </button>
  );
}
