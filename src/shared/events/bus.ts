import { logger } from "@/shared/lib/logger";
import type { DomainEventName, DomainEvents } from "./types";

type Handler<K extends DomainEventName> = (payload: DomainEvents[K]) => Promise<void> | void;

const handlers = new Map<DomainEventName, Handler<DomainEventName>[]>();
let listenersLoaded: Promise<void> | null = null;

/** Registra un listener. Cada módulo lo hace en su `registerListeners()` (src/modules/listeners.ts). */
export function on<K extends DomainEventName>(event: K, handler: Handler<K>) {
  const list = handlers.get(event) ?? [];
  list.push(handler as Handler<DomainEventName>);
  handlers.set(event, list);
}

/**
 * Emite un evento en proceso. Los listeners deben ser rápidos: lo pesado se encola
 * en la tabla `jobs` (ver modules/plataforma). Un listener que falla no tumba a los demás.
 */
export async function emit<K extends DomainEventName>(event: K, payload: DomainEvents[K]) {
  await ensureListeners();
  for (const handler of handlers.get(event) ?? []) {
    try {
      await handler(payload);
    } catch (error) {
      logger.error("listener falló", { event, error: String(error) });
    }
  }
}

async function ensureListeners() {
  listenersLoaded ??= import("@/modules/listeners").then((m) => m.registerAllListeners());
  return listenersLoaded;
}

/** Registra los listeners (y los handlers de la cola) si nadie ha emitido todavía en este proceso */
export const asegurarListeners = ensureListeners;

/** Solo para tests. */
export function __resetBus() {
  handlers.clear();
  listenersLoaded = Promise.resolve();
}
