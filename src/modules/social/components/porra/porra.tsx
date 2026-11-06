import Link from "next/link";
import { formatCDMX } from "@/shared/lib/dates";
import { nombreVisible } from "@/shared/lib/personas";
import { Iniciales } from "@/shared/ui/iniciales";
import { Sobretitulo } from "@/shared/ui/tarjeta";
import { comentariosDe } from "../../server/queries";
import { BotonReportar } from "./boton-reportar";
import { CajaPorra } from "./caja-porra";

/** La porra (pantalla 35 · PRD §6.3): comentarios de una publicación o del muro de un jugador */
export async function Porra({
  postId,
  muroDe,
  yo,
  titulo = "La porra",
}: {
  postId?: string;
  muroDe?: string;
  yo: string | null;
  titulo?: string;
}) {
  const comentarios = await comentariosDe({ postId, muroDe });
  return (
    <section aria-label={titulo} className="flex flex-col gap-2.5">
      <Sobretitulo className="text-muted-foreground">
        {titulo}
        {comentarios.length ? ` · ${comentarios.length}` : ""}
      </Sobretitulo>
      {comentarios.length === 0 && <p className="text-sm text-muted-foreground">Nadie le ha echado porra todavía. ¡Ábrele!</p>}
      <ul className="flex flex-col gap-2">
        {comentarios.map((c) => (
          <li key={c.id} className="flex items-start gap-2.5">
            <Link href={`/j/${c.author.username}`} aria-label={`Perfil de ${nombreVisible(c.author)}`}>
              <Iniciales nombre={nombreVisible(c.author)} tamano={32} />
            </Link>
            <div className="min-w-0 flex-1 rounded-xl bg-surface-2 px-3 py-2 text-[13px]">
              <p className="flex items-baseline gap-2">
                <b>{nombreVisible(c.author)}</b>
                <span className="text-[11px] text-muted-foreground">{formatCDMX(c.createdAt, "EEE d · HH:mm")}</span>
              </p>
              <p className="break-words whitespace-pre-line">{c.body}</p>
            </div>
            {yo && yo !== c.author.id && <BotonReportar comentarioId={c.id} />}
          </li>
        ))}
      </ul>
      <CajaPorra postId={postId} muroDe={muroDe} conSesion={Boolean(yo)} />
    </section>
  );
}
