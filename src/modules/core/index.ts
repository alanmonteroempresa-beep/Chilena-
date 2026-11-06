// API pública del módulo `core`.
export { FLAG_DEFAULTS, type FlagKey } from "./flags.defaults";
export { publicUserSelect } from "./server/queries";
export { can, assertCan, registerRule, type Action, type AuthzContext } from "./server/authz";
export { DomainError, ForbiddenError, NotFoundError } from "./server/authz/errors";
// Selector de rol (servicio puro)
export {
  escudoNeutro,
  hrefCentral,
  opcionActiva,
  opcionesDeRol,
  SIN_CONTEXTO,
  type Contexto,
} from "./server/services/roles-sesion";
// Solo servidor (importan "server-only"):
//   import { isEnabled } from "@/modules/core/server-api";
//   import { getCurrentUser, requireUser } from "@/modules/core/server-api";
