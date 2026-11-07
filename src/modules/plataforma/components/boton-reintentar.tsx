"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";
import { BotonLima } from "@/shared/ui/button";

/** "REINTENTAR" (pantalla 08b): recarga; si vuelve la señal, recarga sola */
export function BotonReintentar() {
  useEffect(() => {
    const volver = () => window.location.reload();
    window.addEventListener("online", volver);
    return () => window.removeEventListener("online", volver);
  }, []);
  return (
    <BotonLima className="w-full" onClick={() => window.location.reload()}>
      <RotateCw aria-hidden />
      Reintentar
    </BotonLima>
  );
}
