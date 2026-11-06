import type { Metadata } from "next";
import { Suspense } from "react";
import { encabezadoDe } from "@/modules/carta/server-api";
import { PaginaPerfil, yaSigue } from "@/modules/social/server-api";
import { EncabezadoPerfil } from "@/shared/ui/encabezado-perfil";
import { PerfilCargando } from "./cargando";
import { perfilDelJugador } from "./perfil-del-jugador";

export const metadata: Metadata = { title: "Perfil" };

// Perfil público del jugador (pantalla 06 · `/j/[username]`, módulo social). Lo ve cualquiera.
export default function PerfilPage({ params }: PageProps<"/j/[username]">) {
  return (
    <Suspense fallback={<PerfilCargando />}>
      <Perfil params={params} />
    </Suspense>
  );
}

async function Perfil({ params }: Pick<PageProps<"/j/[username]">, "params">) {
  const { username } = await params;
  const { d, esPropio, yo } = await perfilDelJugador(username);
  const siguiendo = yo && !esPropio ? await yaSigue(yo, { persona: d.persona.id }) : false;
  return (
    <>
      <EncabezadoPerfil {...encabezadoDe(d)} activa="carta" />
      <PaginaPerfil d={d} esPropio={esPropio} yo={yo} siguiendo={siguiendo} />
    </>
  );
}
