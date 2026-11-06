import Link from "next/link";
import { Plus } from "lucide-react";
import { textoSobre } from "@/shared/lib/color";
import { nombreCorto } from "@/shared/lib/personas";
import { cn } from "@/shared/lib/utils";
import { AccionPronto } from "@/shared/ui/accion-pronto";
import { buttonVariants } from "@/shared/ui/button";
import { ChipEstado } from "@/shared/ui/chip-marcador";
import { coloresDe, Escudo } from "@/shared/ui/escudo";
import { Iniciales } from "@/shared/ui/iniciales";
import { Sobretitulo, Tarjeta, TarjetaRol, TituloSeccion } from "@/shared/ui/tarjeta";
import { datosInicioAficionado } from "../../server/inicio";

/**
 * Inicio del aficionado · Siguiendo (pantalla 05 · export 05 claro): lo que sigue, cómo quedó su equipo
 * (cédula validada), su próximo partido, la tabla y cracks para seguir. Sin seguir a nadie: sugerencias
 * (PRD §6.16). Solo lectura.
 */
export async function InicioAficionado({ userId, ahora }: { userId: string; ahora: Date }) {
  const d = await datosInicioAficionado(userId, ahora);

  if (!d.equipo) {
    return (
      <main className="flex flex-col gap-3 px-4 pt-3.5 pb-6">
        <TarjetaRol className="flex flex-col gap-1">
          <Sobretitulo>Siguiendo</Sobretitulo>
          <h1 className="titular-momento text-[38px]">Sigue a tu equipo</h1>
          <p className="text-[13px] text-white/80">Y aquí te sale su próximo partido, cómo quedó y la tabla.</p>
        </TarjetaRol>
        <Tarjeta>
          <ul className="divide-y divide-border">
            {d.sugeridos.map((e) => (
              <li key={e.id} className="flex min-h-14 items-center gap-3 px-3.5 py-2">
                <Escudo {...coloresDe(e)} tamano={30} />
                <span className="flex-1 text-sm font-semibold">{e.nombre}</span>
                <SeguirPronto />
              </li>
            ))}
          </ul>
        </Tarjeta>
      </main>
    );
  }

  const siglas = d.torneo?.liga.siglas ?? d.torneo?.liga.nombre;
  return (
    <main className="flex flex-col gap-3 px-4 pt-3.5 pb-6">
      <h1 className="sr-only">Lo que sigues</h1>
      <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pt-1 pb-1 [scrollbar-width:none]" aria-label="Lo que sigues">
        {d.sigue.equipos.map((e) => (
          <Historia key={e.id} nombre={nombreCorto(e.nombre)}>
            <span
              className="etiqueta inline-flex size-[50px] items-center justify-center rounded-full text-[15px] font-extrabold shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--role-accent)]"
              style={{ background: coloresDe(e).color, color: textoSobre(coloresDe(e).color) }}
            >
              {e.siglas}
            </span>
          </Historia>
        ))}
        {d.sigue.cracks.map((c) => (
          <Historia key={c.id} nombre={c.sobrenombre ?? c.nombre} href={`/j/${c.username}`}>
            <Iniciales nombre={c.sobrenombre ?? c.nombre} tamano={50} aro />
          </Historia>
        ))}
        <li className="flex w-[52px] shrink-0 flex-col items-center gap-1.5">
          <AccionPronto
            aria-label="Seguir a alguien más"
            className="inline-flex size-[50px] items-center justify-center rounded-full border-[1.5px] border-dashed border-brand-silver text-role"
          >
            <Plus aria-hidden className="size-6" />
          </AccionPronto>
          <span className="text-[11px] font-semibold text-muted-foreground">Seguir</span>
        </li>
      </ul>

      {d.ultimo && (
        <Tarjeta className="flex flex-col gap-3 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <Sobretitulo className="text-role">
              Tu equipo{d.ultimo.jornada ? ` · J${d.ultimo.jornada}` : ""}
            </Sobretitulo>
            <ChipEstado estado={{ tipo: "oficial" }} />
          </div>
          <div
            className="flex items-center justify-between gap-2"
            role="img"
            aria-label={`${d.ultimo.local.nombre} ${d.ultimo.golesLocal}, ${d.ultimo.visita.nombre} ${d.ultimo.golesVisita}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Escudo {...coloresDe(d.ultimo.local)} tamano={30} conSiglas={false} />
              <span className="font-display truncate text-[21px] font-black uppercase italic">{nombreCorto(d.ultimo.local.nombre)}</span>
            </span>
            <span className="font-display text-[34px] leading-none font-black whitespace-nowrap">
              {d.ultimo.golesLocal}–{d.ultimo.golesVisita}
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="font-display truncate text-[21px] font-black uppercase italic">{nombreCorto(d.ultimo.visita.nombre)}</span>
              <Escudo {...coloresDe(d.ultimo.visita)} tamano={30} conSiglas={false} />
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {d.ultimo.gol ? (
              <span className="flex-1 text-[13px]">
                {d.ultimo.gol.minuto != null && <b className="text-role">{d.ultimo.gol.minuto}&apos; </b>}
                {d.ultimo.gol.texto}
              </span>
            ) : (
              <span className="flex-1 text-[13px] text-muted-foreground">Final</span>
            )}
            <Link
              href={`/partido/${d.ultimo.id}`}
              className={buttonVariants({ variant: "lima", size: "cta", className: "h-9 px-3 text-xs" })}
            >
              Ver partido
            </Link>
          </div>
        </Tarjeta>
      )}

      {d.proximo && (
        <TarjetaRol className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <Sobretitulo className="text-white/85">Próximo de {nombreCorto(d.equipo.nombre)}</Sobretitulo>
            <p className="titular-momento mt-1 truncate text-[26px]">vs {d.proximo.rival.nombre}</p>
            <p className="mt-1 text-xs text-white/80">{d.proximo.horario}</p>
          </div>
          <AccionPronto className={buttonVariants({ variant: "lima", size: "cta", className: "h-10 px-3.5 text-xs" })}>
            Ahí estaré
          </AccionPronto>
        </TarjetaRol>
      )}

      {d.tabla.length > 0 && (
        <Tarjeta className="flex flex-col gap-1 p-3.5">
          <div className="flex items-end justify-between">
            <TituloSeccion>Tabla{siglas ? ` · ${siglas}` : ""}</TituloSeccion>
            <span className="etiqueta text-[11px] tracking-[0.12em] text-muted-foreground">PJ · DG · PTS</span>
          </div>
          <ol className="mt-1 flex flex-col">
            {d.tabla.map((f) => {
              const mio = d.sigue.equipos.some((e) => e.id === f.team.id);
              return (
                <li
                  key={f.team.id}
                  className={cn("flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13px]", mio && "bg-role/10 font-semibold")}
                >
                  <span className="etiqueta w-4 text-muted-foreground">{f.posicion}</span>
                  <Escudo {...coloresDe(f.team)} tamano={14} conSiglas={false} />
                  <span className="min-w-0 flex-1 truncate">{f.team.nombre}</span>
                  <span className="etiqueta w-6 text-right text-muted-foreground">{f.pj}</span>
                  <span className="etiqueta w-8 text-right text-muted-foreground">{f.dg > 0 ? `+${f.dg}` : f.dg}</span>
                  <span className={cn("etiqueta w-7 text-right text-sm font-extrabold", mio && "text-role")}>{f.pts}</span>
                </li>
              );
            })}
          </ol>
        </Tarjeta>
      )}

      {d.cracks.length > 0 && (
        <Tarjeta className="flex flex-col gap-1 p-3.5">
          <TituloSeccion>Sigue a más cracks</TituloSeccion>
          <ul className="mt-1 flex flex-col">
            {d.cracks.map((c) => (
              <li key={c.id} className="flex min-h-12 items-center gap-3">
                <Link href={`/j/${c.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Iniciales nombre={c.nombre} tamano={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{c.nombre}</span>
                    <span className="block truncate text-xs text-muted-foreground">{c.detalle}</span>
                  </span>
                </Link>
                <SeguirPronto />
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}
    </main>
  );
}

function Historia({ nombre, href, children }: { nombre: string; href?: string; children: React.ReactNode }) {
  const contenido = (
    <>
      {children}
      <span className="w-full truncate text-center text-[11px] font-semibold">{nombre}</span>
    </>
  );
  return (
    <li className="w-[52px] shrink-0">
      {href ? (
        <Link href={href} className="flex flex-col items-center gap-1.5">
          {contenido}
        </Link>
      ) : (
        <div className="flex flex-col items-center gap-1.5">{contenido}</div>
      )}
    </li>
  );
}

function SeguirPronto() {
  return (
    <AccionPronto className="etiqueta inline-flex min-h-11 items-center px-2 text-xs font-extrabold tracking-[0.12em] text-role">
      Seguir
    </AccionPronto>
  );
}
