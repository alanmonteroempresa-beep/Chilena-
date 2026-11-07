import { z } from "zod";
import { esServicioDePush } from "./server/services/push";

// La suscripción que da el navegador (PushSubscription.toJSON()). El mismo esquema en el celular y en la acción.
export const suscripcionSchema = z.object({
  endpoint: z.string().url().max(1000).refine(esServicioDePush, "Ese navegador no tiene un servicio de avisos que conozcamos."),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});
export const quitarSuscripcionSchema = z.object({ endpoint: z.string().url().max(1000) });
