import type { ColoresEquipo } from "@/shared/ui/escudo";

/** Un equipo como lo necesita la cédula del árbitro (lo arma la página con lo que da `equipos`) */
export type EquipoCedula = {
  teamId: string;
  nombre: string;
  corto: string;
  siglas: string;
  colores: ColoresEquipo;
  conAlineacion: boolean;
  jugadores: { userId: string; nombre: string; numero: number | null; bloqueado: boolean; motivo: string | null; enAlineacion: boolean }[];
  delegados: { userId: string; nombre: string }[];
};

/** Etiqueta corta del tipo de gol en los chips de la cédula (lámina 29) */
export const CHIP_TIPO_GOL: Record<string, string> = {
  JUGADA: "Normal",
  CABEZA: "Cabeza",
  PENAL: "Penal",
  TIRO_LIBRE: "T. libre",
  FUERA_DEL_AREA: "Fuera",
  CHILENA: "Chilena",
  PANENKA: "Panenka",
  OLIMPICO: "Olímpico",
};
