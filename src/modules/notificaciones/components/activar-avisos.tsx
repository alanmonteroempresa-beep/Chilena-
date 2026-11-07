"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, BellOff, BellRing, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { BotonLima, Button } from "@/shared/ui/button";
import { avisoDePrueba, guardarSuscripcion, quitarSuscripcion } from "../server/actions";

type Estado =
  | "revisando"
  | "sin-soporte" // el navegador no tiene push
  | "iphone-sin-instalar" // iPhone: solo con la app en la pantalla de inicio
  | "solo-publicada" // en desarrollo no hay service worker
  | "bloqueados" // dijo que no en el permiso del navegador
  | "apagados"
  | "activados";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** La llave pública VAPID en base64url → bytes (lo pide `pushManager.subscribe`) */
function llave(base64: string) {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const crudo = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(crudo, (c) => c.charCodeAt(0));
}

const esIphone = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
const instalada = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** El service worker de la app (solo en producción); en desarrollo no hay y no se espera para siempre */
async function registro() {
  const r = await navigator.serviceWorker.getRegistration("/");
  if (r) return r;
  return Promise.race([navigator.serviceWorker.ready, new Promise<null>((ok) => setTimeout(() => ok(null), 4000))]);
}

/**
 * "Activar avisos" (docs/NOTIFICACIONES.md): pide el permiso y guarda este celular para mandarle push
 * (Te toca jugar, Ya es oficial, Vota el MVP…). En iPhone solo funciona con la app instalada.
 * `compacto`: una fila para la campana; si ya están activados, no se muestra.
 */
export function ActivarAvisos({ compacto = false }: { compacto?: boolean }) {
  const [estado, setEstado] = useState<Estado>("revisando");
  const [pendiente, startTransition] = useTransition();

  const revisar = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
      return setEstado(esIphone() && !instalada() ? "iphone-sin-instalar" : "sin-soporte");
    }
    if (!("PushManager" in window)) return setEstado(esIphone() && !instalada() ? "iphone-sin-instalar" : "sin-soporte");
    if (Notification.permission === "denied") return setEstado("bloqueados");
    const r = await registro();
    if (!r) return setEstado("solo-publicada");
    const sub = await r.pushManager.getSubscription();
    setEstado(sub && Notification.permission === "granted" ? "activados" : "apagados");
  }, []);

  useEffect(() => {
    // Lo que sabe el navegador solo se lee en el celular, después de montar
    const t = setTimeout(() => void revisar(), 0);
    return () => clearTimeout(t);
  }, [revisar]);

  const activar = () =>
    startTransition(async () => {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueados" : "apagados");
        return void toast.error("Sin permiso no te podemos avisar.");
      }
      const r = await registro();
      if (!r) return setEstado("solo-publicada");
      try {
        const sub = (await r.pushManager.getSubscription()) ?? (await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: llave(VAPID) }));
        const res = await guardarSuscripcion(sub.toJSON());
        if (!res.ok) return void toast.error(res.error);
        setEstado("activados");
        toast.success("Listo: te avisamos aquí en el celular.");
      } catch {
        toast.error("Tu celular no dejó activar los avisos. Intenta otra vez.");
      }
    });

  const apagar = () =>
    startTransition(async () => {
      const r = await registro();
      const sub = await r?.pushManager.getSubscription();
      if (sub) {
        await quitarSuscripcion({ endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setEstado("apagados");
      toast.success("Avisos apagados en este celular.");
    });

  const probar = () =>
    startTransition(async () => {
      const r = await avisoDePrueba();
      if (!r.ok) return void toast.error(r.error);
      toast.success("Te mandamos uno. Debe llegarte en unos segundos.");
    });

  if (estado === "revisando") return compacto ? null : <div className="h-[92px] rounded-2xl bg-surface" aria-hidden />;
  if (compacto && (estado === "activados" || estado === "sin-soporte" || estado === "solo-publicada")) return null;

  const textos: Record<Exclude<Estado, "revisando">, string> = {
    "sin-soporte": "Este navegador no recibe avisos. Usa Chrome en Android o instala la app en iPhone.",
    "iphone-sin-instalar": "En iPhone los avisos llegan solo con la app en tu pantalla de inicio.",
    "solo-publicada": "Los avisos al celular funcionan en chilena.vercel.app.",
    bloqueados: "Los bloqueaste en este navegador. Actívalos en los permisos del sitio y vuelve aquí.",
    apagados: "Te avisamos cuando te toque jugar, cuando sea oficial y cuando haya que votar al MVP.",
    activados: "Te llegan en este celular: Te toca jugar, Ya es oficial y Vota el MVP.",
  };

  return (
    <section
      aria-label="Avisos al celular"
      className={cn("flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-3.5", estado === "activados" && "border-role/40")}
    >
      <p className="flex items-center gap-2 font-semibold">
        {estado === "activados" ? (
          <BellRing aria-hidden className="size-5 text-role" />
        ) : estado === "bloqueados" ? (
          <BellOff aria-hidden className="size-5 text-muted-foreground" />
        ) : (
          <Bell aria-hidden className="size-5 text-role" />
        )}
        {estado === "activados" ? "Avisos activados" : "Avisos al celular"}
        {estado === "activados" && <Check aria-hidden className="size-4 text-role" />}
      </p>
      <p className="text-[13px] text-muted-foreground">{textos[estado]}</p>
      {estado === "apagados" && (
        <BotonLima className="w-full" disabled={pendiente} onClick={activar}>
          {pendiente ? "Activando…" : "Activar avisos"}
        </BotonLima>
      )}
      {estado === "iphone-sin-instalar" && (
        <Link href="/instalar" className="text-[13px] font-semibold text-role underline underline-offset-4">
          Cómo instalar la app
        </Link>
      )}
      {estado === "activados" && !compacto && (
        <div className="flex flex-wrap gap-2">
          <Button variant="quieto" className="min-h-11 flex-1 border border-border" disabled={pendiente} onClick={probar}>
            Mandarme uno de prueba
          </Button>
          <Button variant="quieto" className="min-h-11 text-muted-foreground" disabled={pendiente} onClick={apagar}>
            Apagar
          </Button>
        </div>
      )}
    </section>
  );
}
