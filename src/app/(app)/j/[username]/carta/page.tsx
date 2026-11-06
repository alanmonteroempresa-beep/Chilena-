import type { Metadata } from "next";
import { Suspense } from "react";
import { PaginaCarta } from "@/modules/carta/server-api";
import { PerfilCargando } from "../cargando";
import { perfilDelJugador } from "../perfil-del-jugador";

export const metadata: Metadata = { title: "La carta" };

// La carta en detalle: frente y reverso (pantallas 25a y 25b · `/j/[username]/carta`, módulo carta)
export default function CartaPage({ params }: PageProps<"/j/[username]/carta">) {
  return (
    <Suspense fallback={<PerfilCargando />}>
      <Carta params={params} />
    </Suspense>
  );
}

async function Carta({ params }: Pick<PageProps<"/j/[username]/carta">, "params">) {
  const { username } = await params;
  const { d, esPropio } = await perfilDelJugador(username);
  return <PaginaCarta d={d} esPropio={esPropio} />;
}
