import Link from "next/link";
import { CalendarDays, CircleDollarSign, FileSignature, Flame, IdCard, MessageCircle, Shield, Trophy, UserPlus } from "lucide-react";
import type { NotificationType } from "@/generated/prisma/client";
import { nombreVisible } from "@/shared/lib/personas";
import { cn } from "@/shared/lib/utils";
import { Iniciales } from "@/shared/ui/iniciales";
import { Sobretitulo } from "@/shared/ui/tarjeta";
import { marcarLeidas } from "../server/actions";
import { avisosDe } from "../server/queries";
import { accionDe, haceCuanto, pestanaDe, seccionDe, type Pestana } from "../server/services/campana";

const PESTANAS: [Pestana, string][] = [
  ["todas", "Todas"],
  ["partidos", "Partidos"],
  ["social", "Social"],
  ["liga", "Liga"],
];

const ICONO: Partial<Record<NotificationType, typeof Flame>> = {
  REACCION: Flame,
  COMENTARIO: MessageCircle,
  NUEVO_SEGUIDOR: UserPlus,
  INSIGNIA: Trophy,
  CARTA_ACTUALIZADA: IdCard,
  CEDULA_POR_FIRMAR: FileSignature,
  CORRECCION_CEDULA: FileSignature,
  PASE_DE_LISTA: CalendarDays,
  RECORDATORIO_PARTIDO: CalendarDays,
  RESULTADO_OFICIAL: Shield,
  ASIGNACION_ARBITRO: CalendarDays,
  CUOTA: CircleDollarSign,
  PAGO_REPORTADO: CircleDollarSign,
  SANCION: Shield,
};

/** La campana (pantalla 09): pestañas Todas · Partidos · Social · Liga; Hoy · Esta semana · Antes */
export async function Campana({ userId, pestana, ahora }: { userId: string; pestana: Pestana; ahora: Date }) {
  const avisos = (await avisosDe(userId)).filter((a) => pestana === "todas" || pestanaDe(a.type) === pestana);
  const secciones = new Map<string, typeof avisos>();
  for (const a of avisos) {
    const s = seccionDe(a.createdAt, ahora);
    secciones.set(s, [...(secciones.get(s) ?? []), a]);
  }
  const hayNuevos = avisos.some((a) => !a.readAt);
  return (
    <main className="flex flex-col gap-3 px-4 pt-3.5 pb-6">
      <div className="flex items-end justify-between gap-2">
        <h1 className="titular-momento text-[40px] leading-[0.88]">Notificaciones</h1>
        {hayNuevos && (
          <form action={marcarLeidas}>
            <button type="submit" className="etiqueta min-h-11 px-1 text-xs font-extrabold tracking-[0.12em] text-role">
              Marcar leídas
            </button>
          </form>
        )}
      </div>
      <nav aria-label="Tipos de aviso" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
        {PESTANAS.map(([clave, texto]) => (
          <Link
            key={clave}
            href={clave === "todas" ? "/notificaciones" : `/notificaciones?tab=${clave}`}
            aria-current={clave === pestana ? "page" : undefined}
            className={cn(
              "etiqueta inline-flex min-h-10 shrink-0 items-center rounded-full border px-3.5 text-xs font-extrabold tracking-[0.12em]",
              clave === pestana ? "border-transparent bg-foreground text-background" : "border-border bg-surface text-muted-foreground",
            )}
          >
            {texto}
          </Link>
        ))}
      </nav>
      {avisos.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Todo tranquilo por aquí. Cuando te echen porra, te sigan o tengas cédula por firmar, te avisamos.
        </p>
      )}
      {[...secciones].map(([seccion, lista]) => (
        <section key={seccion} aria-label={seccion} className="flex flex-col gap-2">
          <Sobretitulo className="text-muted-foreground">{seccion}</Sobretitulo>
          <ul className="flex flex-col gap-2">
            {lista.map((a) => {
              const Icono = ICONO[a.type];
              // Un aviso puede traer su propio chip ("Ver cédula" al árbitro); si no, el de su tipo
              const accion = (a.data as { accion?: string } | null)?.accion ?? accionDe(a.type);
              return (
                <li key={a.id}>
                  <Link
                    href={`/n/${a.id}`}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-3",
                      a.readAt ? "border-transparent" : "border-border bg-surface shadow-[0_1px_2px_rgba(7,9,12,0.05)]",
                    )}
                  >
                    {a.actor ? (
                      <Iniciales nombre={nombreVisible(a.actor)} tamano={40} />
                    ) : (
                      <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-role/14 text-role">
                        {Icono ? <Icono className="size-5" /> : "🔔"}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] leading-snug">
                        <b>{a.title}</b>
                        {a.body ? <span className="text-muted-foreground"> · {a.body}</span> : null}
                      </span>
                      <span className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {haceCuanto(a.createdAt, ahora)}
                        {accion && (
                          <span className="etiqueta rounded-md bg-brand-lime px-2 py-0.5 text-[10px] font-extrabold tracking-[0.12em] text-ink">
                            {accion}
                          </span>
                        )}
                      </span>
                    </span>
                    {!a.readAt && <span aria-label="Sin leer" className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-lime" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
