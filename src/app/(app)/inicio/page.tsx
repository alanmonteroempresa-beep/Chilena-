import type { Metadata } from "next";
import { Suspense } from "react";
import { InicioVacio, necesitaCompletarPerfil, TarjetaCompletarPerfil } from "@/modules/core/server-api";
import { InicioDelegado } from "@/modules/equipos/server-api";
import { InicioLiga, pagosAlArbitro, torneoVigenteDeLaLiga } from "@/modules/ligas/server-api";
import { InicioArbitro } from "@/modules/partidos/server-api";
import { InicioAficionado, InicioJugador, reportesAbiertos } from "@/modules/social/server-api";
import { nombreVisible } from "@/shared/lib/personas";
import type { Rol } from "@/shared/lib/roles";
import { Skeleton } from "@/shared/ui/skeleton";
import { sesionActiva } from "../sesion";

export const metadata: Metadata = { title: "Inicio" };

// Inicio según el rol activo: 03 jugador · 04 delegado · 05 aficionado · 02 árbitro · 18 liga (PRD §5)
export default function InicioPage() {
  return (
    <Suspense fallback={<InicioCargando />}>
      <Inicio />
    </Suspense>
  );
}

async function Inicio() {
  const sesion = await sesionActiva();
  if (!sesion?.activa) return null;
  const { usuario, activa } = sesion;
  // Después de leer la sesión (petición real): la hora de "ahora" ya no se prerenderiza
  const ahora = new Date();
  return (
    <>
      {necesitaCompletarPerfil(usuario) && <TarjetaCompletarPerfil />}
      <InicioDelRol
        rol={activa.rol}
        slugEquipo={activa.slugEquipo}
        slugLiga={activa.slugLiga}
        ligaCorta={activa.ligaCorta}
        usuario={usuario}
        ahora={ahora}
      />
    </>
  );
}

async function InicioDelRol({
  rol,
  slugEquipo,
  slugLiga,
  ligaCorta,
  usuario,
  ahora,
}: {
  rol: Rol;
  slugEquipo?: string;
  slugLiga?: string;
  ligaCorta?: string;
  usuario: { id: string; nombre: string; sobrenombre: string | null };
  ahora: Date;
}) {
  switch (rol) {
    case "jugador":
      return slugEquipo ? (
        <InicioJugador userId={usuario.id} slugEquipo={slugEquipo} ahora={ahora} persona={usuario} />
      ) : (
        <InicioVacio rol="jugador" />
      );
    case "delegado":
      return slugEquipo ? <InicioDelegado slugEquipo={slugEquipo} ahora={ahora} /> : <InicioVacio rol="delegado" />;
    case "aficionado":
      return <InicioAficionado userId={usuario.id} ahora={ahora} />;
    case "arbitro": {
      if (!slugLiga) return <InicioVacio rol="arbitro" />;
      const pagos = await pagosAlArbitro(usuario.id);
      return (
        <InicioArbitro
          userId={usuario.id}
          ahora={ahora}
          ligaCorta={ligaCorta}
          porCobrarCents={pagos.reduce((s, p) => s + p.amountCents, 0)}
        />
      );
    }
    case "liga": {
      if (!slugLiga) return <InicioVacio rol="liga" />;
      // Los reportes de la porra son de social; el panel es de ligas: aquí se juntan (sin ciclo entre módulos)
      const torneo = await torneoVigenteDeLaLiga(slugLiga);
      const reportes = torneo ? await reportesAbiertos(torneo.league.id) : 0;
      return <InicioLiga slugLiga={slugLiga} ahora={ahora} nombre={nombreVisible(usuario)} reportesAbiertos={reportes} />;
    }
  }
}

function InicioCargando() {
  return (
    <div className="flex flex-col gap-3 px-4 pt-3.5" aria-hidden>
      <Skeleton className="h-60 rounded-[18px]" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-16 rounded-2xl" />
    </div>
  );
}
