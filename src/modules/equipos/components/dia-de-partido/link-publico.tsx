import { coloresDe, Escudo } from "@/shared/ui/escudo";
import { Logo } from "@/shared/ui/logo";
import { datosLink } from "../../server/pase-de-lista";
import { ContestarLink } from "./contestar-link";

/** El link del pase de lista que llega al grupo de WhatsApp (pantalla 20): sin cuenta */
export async function PaginaLink({ token, ahora }: { token: string; ahora: Date }) {
  const d = await datosLink(token, ahora);
  if (!d) return null;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 bg-background px-4 pt-6 pb-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo tamano={44} />
        <div className="flex items-center gap-2" aria-label={`${d.partido.local.nombre} contra ${d.partido.visita.nombre}`}>
          <Escudo {...coloresDe(d.partido.local)} tamano={36} />
          <span className="font-display text-sm font-black">VS</span>
          <Escudo {...coloresDe(d.partido.visita)} tamano={36} />
        </div>
        <h1 className="titular-momento text-[52px] leading-[0.85]">
          ¿Vas
          <br />
          <span className="text-brand-blue dark:text-brand-lime">{d.partido.cuando.toLowerCase()}?</span>
        </h1>
        <p className="text-sm font-semibold">
          {d.equipo.nombre} vs {d.partido.rivalCompleto} · {d.partido.horario}
        </p>
        <p className="text-xs text-muted-foreground">
          {d.resumen.van} de {d.resumen.total} ya contestaron que van
        </p>
      </div>
      {d.vencido ? (
        <p className="rounded-2xl bg-surface-2 p-4 text-center text-sm">Este pase de lista ya cerró. Pídele uno nuevo a tu delegado.</p>
      ) : (
        <ContestarLink token={d.token} jugadores={d.jugadores} delegado="tu delegado" />
      )}
      <p className="text-center text-xs text-muted-foreground">Sin cuenta y sin descargar nada. ¿Quieres tu carta de crack? Entra a Chilena.</p>
    </main>
  );
}
