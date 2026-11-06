import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/modules/core/server-api";
import { plantillasParaLaCedula } from "@/modules/equipos/server-api";
import type { EquipoCedula } from "@/modules/partidos";
import { CedulaArbitro, CedulaEnviada, vistaDeLaCedula, type VistaDeLaCedula } from "@/modules/partidos/server-api";
import { Skeleton } from "@/shared/ui/skeleton";

export const metadata: Metadata = { title: "Cédula", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VOLVER = "/arbitro/hoy";

// Cédula al final del partido (pantallas 56a y 56b) a pantalla completa, y lo que pasa después (02, 19).
// Fuera del cascarón: en la cancha el celular pasa de mano en mano para las firmas.
export default function CedulaPage({ params }: PageProps<"/arbitro/cedula/[matchId]">) {
  return (
    <Suspense fallback={<Skeleton className="m-4 h-[80dvh] rounded-2xl" />}>
      <Cedula params={params} />
    </Suspense>
  );
}

async function Cedula({ params }: Pick<PageProps<"/arbitro/cedula/[matchId]">, "params">) {
  const [{ matchId }, usuario] = await Promise.all([params, getCurrentUser()]);
  if (!usuario || !UUID.test(matchId)) notFound();
  const v = await vistaDeLaCedula(matchId);
  // Solo el árbitro asignado (PERMISOS §4); a los demás ni se les dice que existe
  if (!v || v.refereeId !== usuario.id) notFound();
  if (v.cedula && v.cedula.estado !== "BORRADOR") return <CedulaEnviada v={v} volver={VOLVER} />;
  if (v.partido !== "PROGRAMADO" && v.partido !== "EN_JUEGO")
    return <p className="px-4 pt-10 text-center text-sm text-muted-foreground">Este partido no se juega ({v.partido.toLowerCase()}).</p>;

  const [pLocal, pVisita] = await plantillasParaLaCedula(matchId, v.tournamentId, [v.local.teamId, v.visita.teamId]);
  const equipo = (e: VistaDeLaCedula["local"], p: typeof pLocal): EquipoCedula => ({
    teamId: e.teamId,
    nombre: e.nombre,
    corto: e.corto,
    siglas: e.siglas,
    colores: e.colores,
    conAlineacion: p.conAlineacion,
    jugadores: p.jugadores,
    delegados: p.delegados,
  });
  return (
    <CedulaArbitro
      matchId={matchId}
      sobretitulo={[v.jornada ? `J${v.jornada}` : null, v.horario].filter(Boolean).join(" · ")}
      local={equipo(v.local, pLocal)}
      visita={equipo(v.visita, pVisita)}
      volver={VOLVER}
    />
  );
}
