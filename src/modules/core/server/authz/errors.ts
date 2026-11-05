// Errores de dominio tipados → la UI los muestra como toasts amables.
export class DomainError extends Error {
  constructor(message: string, readonly code = "DOMAIN_ERROR") {
    super(message);
    this.name = "DomainError";
  }
}
export class ForbiddenError extends DomainError {
  constructor(message = "No tienes permiso para hacer esto.") {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}
export class NotFoundError extends DomainError {
  constructor(message = "No encontramos lo que buscas.") {
    super(message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}
