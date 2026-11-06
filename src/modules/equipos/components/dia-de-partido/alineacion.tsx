import { NIVEL_ALERTA, textoAlerta } from "@/modules/partidos";
import { Sobretitulo } from "@/shared/ui/tarjeta";
import { revisionDeAlineacion } from "../../server/alineacion";
import { datosPaseDeLista } from "../../server/pase-de-lista";
import { alineacionDe } from "../../server/queries";
import { FormularioAlineacion, type JugadorAlineable } from "./formulario-alineacion";

/** Alineación del próximo partido (pantalla 53 · PRD §7.6): se arma con los que van */
export async function PaginaAlineacion({ slugEquipo, ahora }: { slugEquipo: string; ahora: Date }) {
  const d = await datosPaseDeLista(slugEquipo, ahora);
  if (!d) return null;
  if (!d.partido) return <p className="px-4 pt-4 text-sm text-muted-foreground">No hay partido programado.</p>;
  const [{ revision }, previa] = await Promise.all([revisionDeAlineacion(d.equipo.id, null), alineacionDe(d.partido.id, d.equipo.id)]);
  const jugadores: JugadorAlineable[] = d.jugadores.map((j) => {
    const r = revision.porJugador.find((x) => x.userId === j.id);
    const enPrevia = previa?.players.find((p) => p.userId === j.id);
    return {
      id: j.id,
      nombre: j.nombre,
      numero: j.numero,
      va: j.respuesta === "VA",
      bloqueado: r?.bloqueado ?? false,
      alertas: (r?.alertas ?? []).map((a) => ({ nivel: NIVEL_ALERTA[a.tipo], titulo: textoAlerta(a).titulo })),
      inicial: r?.bloqueado ? "fuera" : enPrevia ? (enPrevia.titular ? "titular" : "banca") : previa ? "fuera" : j.respuesta === "VA" ? "titular" : "fuera",
      capitan: enPrevia?.capitan ?? false,
    };
  });
  // Primero los que van, luego por dorsal
  jugadores.sort((a, b) => Number(b.va) - Number(a.va) || (a.numero ?? 99) - (b.numero ?? 99));
  return (
    <main className="flex flex-col gap-3 px-4 pt-3.5 pb-6">
      <Sobretitulo className="text-role">
        {d.partido.jornada ? `J${d.partido.jornada} · ` : ""}vs {d.partido.rival} · {d.partido.horario}
      </Sobretitulo>
      <h1 className="titular-momento text-[40px] leading-[0.88]">Alineación</h1>
      <FormularioAlineacion matchId={d.partido.id} teamId={d.equipo.id} jugadores={jugadores} volver={`/equipo/${slugEquipo}/pase-de-lista`} />
    </main>
  );
}
