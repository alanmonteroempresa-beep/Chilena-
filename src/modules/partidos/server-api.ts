// API pública de servidor del módulo `partidos` (no la importes desde componentes cliente).
export {
  cedulaPorFirmar,
  cedulasPorRevisar,
  estadisticasDelJugador,
  estadisticasVigentes,
  goleoDelTorneo,
  historialDePlantillas,
  jornadaCompleta,
  jornadaQueViene,
  partidosDeLaJornada,
  partidoCompleto,
  partidoValidadoParaFeed,
  partidosValidadosVigentes,
  partidosValidadosConGoles,
  partidosDelArbitro,
  proximoPartidoDelEquipo,
  sancionesActivas,
  tarjetasParaAcumulado,
  ultimaJornadaValidada,
  ultimoResultadoDelEquipo,
} from "./server/queries";
export { InicioArbitro } from "./components/inicio-arbitro";
export { PaginaPartido } from "./components/pagina-partido";
export { registerListeners } from "./server/listeners";
