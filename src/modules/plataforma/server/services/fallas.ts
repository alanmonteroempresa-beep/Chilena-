/** Reportar falla (pantalla 42). Puro. */

/** "¿Qué pasó?" */
export const TIPOS_DE_FALLA = ["NO_CARGA", "SE_VE_RARO", "DATO_MAL", "IDEA", "OTRA"] as const;
export type TipoDeFalla = (typeof TIPOS_DE_FALLA)[number];

export const ETIQUETA_FALLA: Record<TipoDeFalla, string> = {
  NO_CARGA: "Algo no carga",
  SE_VE_RARO: "Se ve raro",
  DATO_MAL: "Un dato está mal",
  IDEA: "Tengo una idea",
  OTRA: "Otra cosa",
};

/** Para que nadie llene la tabla sin querer: máximo 10 reportes por hora por cuenta */
export const MAXIMO_POR_HORA = 10;

/** Lo que se guarda en `bug_reports.descripcion`: "Un dato está mal · En la tabla Portales sale con 32…" */
export const descripcionDelReporte = (tipo: TipoDeFalla, texto: string) => `${ETIQUETA_FALLA[tipo]} · ${texto.trim()}`.slice(0, 2000);
