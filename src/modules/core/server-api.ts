// API pública de servidor del módulo `core` (separada para no arrastrar "server-only" a componentes cliente).
export { isEnabled } from "./server/flags";
export { getCurrentUser, requireUser } from "./server/auth";
