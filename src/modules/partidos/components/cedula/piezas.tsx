import { cn } from "@/shared/lib/utils";
import { Chip } from "@/shared/ui/chip";
import { Escudo } from "@/shared/ui/escudo";
import type { EquipoDeLaVista, EventoDeLaVista, VistaDeLaCedula } from "../../server/cedula";
import { CHIP_TIPO_GOL } from "./tipos";

/** Estado de la cédula en palabras (pantallas 02, 04, 19 y 56b) */
export const ESTADO_CEDULA: Record<string, { chip: string; tono: "ambar" | "rojo" | "verde" | "lima" | "neutro" }> = {
  BORRADOR: { chip: "Borrador", tono: "neutro" },
  ENVIADA: { chip: "Por firmar", tono: "ambar" },
  EN_CORRECCION: { chip: "Cédula en pausa", tono: "rojo" },
  FIRMADA: { chip: "Firmada · la revisa la liga", tono: "verde" },
  VALIDADA: { chip: "Validada · oficial", tono: "lima" },
};

export function MarcadorCedula({ v }: { v: VistaDeLaCedula }) {
  const m = v.cedula?.marcador ?? { local: 0, visita: 0 };
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
      <EquipoChico e={v.local} />
      <span className="font-display text-[52px] leading-none font-black text-role" aria-label={`${v.local.corto} ${m.local}, ${v.visita.corto} ${m.visita}`}>
        {m.local}–{m.visita}
      </span>
      <EquipoChico e={v.visita} />
    </div>
  );
}

function EquipoChico({ e }: { e: EquipoDeLaVista }) {
  return (
    <div className="flex w-20 flex-col items-center gap-1">
      <Escudo {...e.colores} tamano={32} forma="escudo" />
      <span className="titular-momento truncate text-[14px]">{e.corto}</span>
    </div>
  );
}

/** Una fila de lo que capturó el árbitro (pantalla 19): minuto, tipo, jugador y equipo */
export function FilaDeLaCedula({ e, v, tachado, children }: { e: EventoDeLaVista; v: VistaDeLaCedula; tachado?: boolean; children?: React.ReactNode }) {
  const equipo = e.equipoId === v.local.teamId ? v.local : v.visita;
  const chip =
    e.tipo === "GOL" ? (
      <Chip tono="lima">Gol</Chip>
    ) : e.tipo === "AUTOGOL" ? (
      <Chip tono="ambar">AG</Chip>
    ) : e.tipo === "AMARILLA" ? (
      <Chip tono="ambar">TA</Chip>
    ) : (
      <Chip tono="rojo">TR</Chip>
    );
  return (
    <li className={cn("flex min-h-12 items-center gap-2.5 py-1.5", tachado && "rounded-lg bg-danger/12 px-2")}>
      <span className="font-display w-9 text-[16px] font-black text-muted-foreground">{e.minuto != null ? `${e.minuto}'` : "—"}</span>
      {chip}
      <span className={cn("flex-1 text-[14px] leading-tight font-semibold", tachado && "line-through")}>
        {e.numero != null ? `#${e.numero} ` : ""}
        {e.tipo === "AUTOGOL" ? `Autogol de ${e.nombre}` : e.nombre}
        {e.tipoGol && e.tipoGol !== "JUGADA" && <span className="font-normal text-muted-foreground"> · {CHIP_TIPO_GOL[e.tipoGol]}</span>}
        {e.nota && <span className="block text-[12px] font-normal text-muted-foreground">{e.nota}</span>}
      </span>
      <Escudo {...equipo.colores} tamano={18} conSiglas={false} />
      {children}
    </li>
  );
}

export function Firmas({ v }: { v: VistaDeLaCedula }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["local", "visita"] as const).map((lado) => {
        const quien = v.cedula?.firmas[lado];
        return (
          <div key={lado} className={cn("flex flex-col rounded-xl border border-dashed border-border p-2.5 text-[13px]", quien && "border-solid border-success")}>
            <strong className="font-semibold">{v[lado].corto}</strong>
            <span className={quien ? "text-success" : "text-muted-foreground"}>{quien ? `${quien} firmó ✓` : "Falta su firma"}</span>
          </div>
        );
      })}
    </div>
  );
}
