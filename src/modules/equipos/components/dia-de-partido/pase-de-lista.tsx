import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { Iniciales } from "@/shared/ui/iniciales";
import { Sobretitulo, Tarjeta, TarjetaRol, TituloSeccion } from "@/shared/ui/tarjeta";
import { datosPaseDeLista } from "../../server/pase-de-lista";
import type { Respuesta } from "../../server/services/plantilla";
import { CompartirPaseDeLista } from "./compartir";

const RESPUESTA: Record<Respuesta, { texto: string; tono: "verde" | "rojo" | "ambar" | "neutro" }> = {
  VA: { texto: "Va", tono: "verde" },
  NO_VA: { texto: "No va", tono: "rojo" },
  LESIONADO: { texto: "Lesionado", tono: "rojo" },
  SIN_RESPUESTA: { texto: "Sin respuesta", tono: "ambar" },
};

/** Pase de lista del delegado (pantallas 04 y 20 · PRD §7.6) */
export async function PaginaPaseDeLista({ slugEquipo, ahora }: { slugEquipo: string; ahora: Date }) {
  const d = await datosPaseDeLista(slugEquipo, ahora);
  if (!d) return null;
  if (!d.partido) {
    return (
      <main className="flex flex-col gap-3 px-4 pt-3.5 pb-6">
        <h1 className="titular-momento text-[40px] leading-[0.88]">Pase de lista</h1>
        <p className="text-sm text-muted-foreground">{d.equipo.nombre} no tiene partido programado todavía.</p>
      </main>
    );
  }
  const { partido, resumen, jugadores } = d;
  const orden: Respuesta[] = ["SIN_RESPUESTA", "NO_VA", "LESIONADO", "VA"];
  const ordenados = [...jugadores].sort((a, b) => orden.indexOf(a.respuesta) - orden.indexOf(b.respuesta) || (a.numero ?? 99) - (b.numero ?? 99));
  return (
    <main className="flex flex-col gap-3 px-4 pt-3.5 pb-6">
      <h1 className="titular-momento text-[40px] leading-[0.88]">Pase de lista</h1>
      <TarjetaRol className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Sobretitulo className="text-white/90">
            {partido.jornada ? `J${partido.jornada} · ` : ""}vs {partido.rival}
          </Sobretitulo>
          <span className="text-xs text-white/75">{partido.horario}</span>
        </div>
        <p className="flex items-end justify-between gap-3">
          <span className="titular-momento text-[58px] leading-[0.82]">
            <span className="text-brand-lime">{resumen.van}</span>/{resumen.total}
            <span className="sr-only"> van {partido.cuando.toLowerCase()}</span>
          </span>
          <span aria-hidden className="etiqueta pb-1 text-right text-xs leading-tight font-extrabold tracking-[0.14em]">
            Van
            <br />
            {partido.cuando}
          </span>
        </p>
        <p className="text-[13px] text-white/85">
          {resumen.sinContestar ? `${resumen.sinContestar} sin contestar` : "Ya contestaron todos"}
          {resumen.noVan ? ` · ${resumen.noVan} no van` : ""}
        </p>
        <CompartirPaseDeLista
          matchId={partido.id}
          teamId={d.equipo.id}
          sinContestar={jugadores.filter((j) => j.respuesta === "SIN_RESPUESTA").map((j) => j.nombre)}
        />
      </TarjetaRol>

      <Link
        href={`/equipo/${slugEquipo}/alineacion`}
        className={cn(buttonVariants({ variant: "quieto", size: "cta" }), "justify-between border border-border bg-surface")}
      >
        {d.alineacion ? `Alineación lista · ${d.alineacion.titulares} titulares` : "Armar la alineación"}
        <ArrowRight aria-hidden />
      </Link>

      <section aria-labelledby="quien-va" className="flex flex-col gap-2">
        <TituloSeccion className="pt-2">
          <span id="quien-va">¿Quién va?</span>
        </TituloSeccion>
        <Tarjeta>
          <ul className="divide-y divide-border">
            {ordenados.map((j) => (
              <li key={j.id} className="flex min-h-14 items-center gap-3 px-3.5 py-2">
                <span className="font-display w-6 text-center text-[20px] font-black">{j.numero}</span>
                <Iniciales nombre={j.nombre} tamano={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{j.nombre}</span>
                  {j.nota && <span className="block truncate text-xs text-muted-foreground">{j.nota}</span>}
                </span>
                <Chip tono={RESPUESTA[j.respuesta].tono}>{RESPUESTA[j.respuesta].texto}</Chip>
              </li>
            ))}
          </ul>
        </Tarjeta>
      </section>
    </main>
  );
}
