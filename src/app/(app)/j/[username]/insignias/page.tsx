import type { Metadata } from "next";
import { Suspense } from "react";
import { ColeccionInsignias, encabezadoDe } from "@/modules/carta/server-api";
import { EncabezadoPerfil } from "@/shared/ui/encabezado-perfil";
import { PerfilCargando } from "../cargando";
import { perfilDelJugador } from "../perfil-del-jugador";

export const metadata: Metadata = { title: "Insignias" };

// Colección de insignias (pantallas 14 y 28 · `/j/[username]/insignias`, módulo carta)
export default function InsigniasPage({ params }: PageProps<"/j/[username]/insignias">) {
  return (
    <Suspense fallback={<PerfilCargando />}>
      <Insignias params={params} />
    </Suspense>
  );
}

async function Insignias({ params }: Pick<PageProps<"/j/[username]/insignias">, "params">) {
  const { username } = await params;
  const { d, esPropio } = await perfilDelJugador(username, true);
  return (
    <>
      <EncabezadoPerfil {...encabezadoDe(d)} activa="insignias" />
      <ColeccionInsignias d={d} esPropio={esPropio} />
    </>
  );
}
