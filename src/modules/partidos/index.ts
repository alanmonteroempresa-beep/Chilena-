// API pública del módulo `partidos`. Otros módulos SOLO importan desde aquí.
export { registerListeners } from "./server/listeners";

// Servicios puros (PRD §7.6 y §7.8)
export {
  conteoDeTarjetas,
  PUNTOS_JUEGO_LIMPIO,
  puntosJuegoLimpio,
  tarjetasPorJugador,
  type TarjetaCedula,
  type TarjetasDelJugador,
} from "./server/services/tarjetas";
export {
  ajustarSancion,
  alertaPreventiva,
  amarillasAcumuladas,
  aUnaDeLaSuspension,
  partidosCumplidos,
  sancionesAutomaticas,
  type AjusteSancion,
  type EstadoSancion,
  type OrigenSancion,
  type PartidoParaSanciones,
  type ReglasSanciones,
  type ResultadoAjuste,
  type SancionActual,
  type SancionAutomatica,
} from "./server/services/sanciones";
export {
  rachaAsistencia,
  resultadoDelDomingo,
  type DomingoDelEquipo,
  type ResultadoDomingo,
} from "./server/services/asistencia";
export {
  assertAlineacionValida,
  bloquea,
  NIVEL_ALERTA,
  revisarAlineacion,
  revisarJugador,
  textoAlerta,
  type AlertaAlineacion,
  type JugadorParaAlinear,
  type NivelAlerta,
  type RevisionJugador,
} from "./server/services/alineacion";

// Próximo partido y goleo en los inicios (pantallas 02, 03, 04, 05 y 18)
export {
  cuandoTeToca,
  cuentaRegresiva,
  diaDeLaJornada,
  horaCDMX,
  horarioCorto,
} from "./server/services/proximo";
export { chipsDelJugador, lineaDeGol, posicionesDelGoleo, type FilaGoleo } from "./server/services/goleo";
