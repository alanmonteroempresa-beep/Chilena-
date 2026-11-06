// API pública de servidor del módulo `social` (no la importes desde componentes cliente).
export { loQueSigue, reportesAbiertos } from "./server/queries";
export { InicioAficionado } from "./components/inicio/inicio-aficionado";
export { InicioJugador } from "./components/inicio/inicio-jugador";
export { PaginaPerfil } from "./components/perfil/pagina-perfil";
export { PaginaStats } from "./components/perfil/pagina-stats";
export { Feed, PestanasInicio } from "./components/feed/feed";
export type { VistaFeed } from "./server/feed";
export { registerListeners } from "./server/listeners";
export { publicarPartido } from "./server/publicar";
export { PaginaPost } from "./components/pagina-post";
export { FormularioPublicar } from "./components/publicar/formulario";
export { Porra } from "./components/porra/porra";
export { BotonSeguir } from "./components/boton-seguir";
export { yaSigue } from "./server/queries";
