import { z } from "zod";

// La suscripción que da el navegador (PushSubscription.toJSON()). El mismo esquema en el celular y en la acción.
export const suscripcionSchema = z.object({
  endpoint: z.string().url().max(1000).startsWith("https://"),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});
export const quitarSuscripcionSchema = z.object({ endpoint: z.string().url().max(1000) });
