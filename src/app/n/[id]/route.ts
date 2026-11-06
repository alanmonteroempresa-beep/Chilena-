import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/core/server-api";
import { abrirAviso } from "@/modules/notificaciones/server-api";

// Abrir un aviso de la campana: lo marca leído y lleva a donde apunta (funciona sin JavaScript)
export async function GET(request: NextRequest, ctx: RouteContext<"/n/[id]">) {
  const usuario = await getCurrentUser();
  if (!usuario) return NextResponse.redirect(new URL("/entrar", request.url));
  const { id } = await ctx.params;
  const href = /^[0-9a-f-]{36}$/i.test(id) ? await abrirAviso(id, usuario.id) : null;
  const destino = href && href.startsWith("/") && !href.startsWith("//") ? href : "/notificaciones";
  return NextResponse.redirect(new URL(destino, request.url));
}
