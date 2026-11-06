import type { Metadata } from "next";
import { Suspense } from "react";
import { encabezadoDe } from "@/modules/carta/server-api";
import { PaginaStats } from "@/modules/social/server-api";
import { EncabezadoPerfil } from "@/shared/ui/encabezado-perfil";
import { PerfilCargando } from "../cargando";
import { perfilDelJugador } from "../perfil-del-jugador";

export const metadata: Metadata = { title: "Stats" };

// Stats del perfil: torneo actual y carrera (pestaña STATS de las pantallas 06 y 28)
export default function StatsPage({ params }: PageProps<"/j/[username]/stats">) {
  return (
    <Suspense fallback={<PerfilCargando />}>
      <Stats params={params} />
    </Suspense>
  );
}

async function Stats({ params }: Pick<PageProps<"/j/[username]/stats">, "params">) {
  const { username } = await params;
  const { d } = await perfilDelJugador(username);
  return (
    <>
      <EncabezadoPerfil {...encabezadoDe(d)} activa="stats" />
      <PaginaStats d={d} />
    </>
  );
}
