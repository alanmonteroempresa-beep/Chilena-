// API pública de servidor del módulo `votaciones` (no la importes desde componentes cliente).
export { registerListeners } from "./server/listeners";
export { cerrarVencidas } from "./server/mvp";
export { reiniciarVotacionesDelPartido } from "./server/quiniela";
export { votosParaLasCartas } from "./server/carta";
export { PaginaVotaciones } from "./components/pagina-votaciones";
export { PaginaQuiniela } from "./components/pagina-quiniela";
