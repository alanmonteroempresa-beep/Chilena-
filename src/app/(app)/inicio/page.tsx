import type { Metadata } from "next";
import { Suspense } from "react";
import { InicioVacio, necesitaCompletarPerfil, TarjetaCompletarPerfil } from "@/modules/core/server-api";
import { InicioDelegado } from "@/modules/equipos/server-api";
import { InicioLiga, pagosAlArbitro, torneoVigenteDeLaLiga } from "@/modules/ligas/server-api";
import { InicioArbitro } from "@/modules/partidos/server-api";
import { Feed, InicioAficionado, InicioJugador, PestanasInicio, reportesAbiertos, type VistaFeed } from "@/modules/social/server-api";
import { nombreVisible } from "@/shared/lib/personas";
import type { Rol } from "@/shared/lib/roles";
import { Skeleton } from "@/shared/ui/skeleton";
import { sesionActiva } from "../sesion";

export const metadata: Metadata = { title: "Inicio" };

const VISTAS: VistaFeed[] = ["para-ti", "golazos", "siguiendo"];
/** El inicio social (pestañas y feed) es de jugador, delegado y aficionado; árbitro y liga ven su operación */
const CON_FEED = new Set<Rol>(["jugador", "delegado", "aficionado"]);

// Inicio según el rol activo: 03 jugador · 04 delegado · 05 aficionado · 02 árbitro · 18 liga (PRD §5),
// con las pestañas Para ti · Golazos · Siguiendo y el feed automático (10)
export default function InicioPage({ searchParams }: PageProps<"/inicio">) {
  return (
    <Suspense fallback={<InicioCargando />}>
      <Inicio searchParams={searchParams} />
    </Suspense>
  );
}

async function Inicio({ searchParams }: Pick<PageProps<"/inicio">, "searchParams">) {
  const [sesion, { vista: v }] = await Promise.all([sesionActiva(), searchParams]);
  if (!sesion?.activa) return null;
  const { usuario, activa } = sesion;
  // Después de leer la sesión (petición real): la hora de "ahora" ya no se prerenderiza
  const ahora = new Date();
  const conFeed = CON_FEED.has(activa.rol);
  const vista = VISTAS.find((x) => x === v) ?? "para-ti";
  const contexto = { userId: usuario.id, slugEquipo: activa.slugEquipo, slugLiga: activa.slugLiga };
  if (conFeed && vista !== "para-ti") {
    return (
      <>
        <PestanasInicio vista={vista} />
        <Feed contexto={contexto} vista={vista} />
      </>
    );
  }
  return (
    <>
      {conFeed && <PestanasInicio vista="para-ti" />}
      {necesitaCompletarPerfil(usuario) && <TarjetaCompletarPerfil />}
      <InicioDelRol
        rol={activa.rol}
        slugEquipo={activa.slugEquipo}
        slugLiga={activa.slugLiga}
        ligaCorta={activa.ligaCorta}
        usuario={usuario}
        ahora={ahora}
      />
      {conFeed && <Feed contexto={contexto} vista="para-ti" conTitulo />}
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
  usuario: { id: string; username: string; nombre: string; sobrenombre: string | null };
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
