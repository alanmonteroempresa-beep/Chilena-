// API pública del módulo `ligas`. Otros módulos SOLO importan desde aquí.
export { registerListeners } from "./server/listeners";

// Servicios puros (PRD §7.8, §7.11 y §7.13)
export {
  assertFaseRegularCerrable,
  calcularTabla,
  marcarSorteo,
  type CriterioDesempate,
  type EquipoTabla,
  type FilaTabla,
  type PartidoTabla,
  type ReglasTabla,
} from "./server/services/tabla";
export {
  cargoDeMulta,
  condonarCargo,
  descripcionMulta,
  type CargoDeMulta,
  type EstadoCargo,
  type SancionConMulta,
} from "./server/services/cargos";
