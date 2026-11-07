"use server";

import { assertCan, DomainError } from "@/modules/core";
import { getCurrentUser, isEnabled } from "@/modules/core/server-api";
import type { Prisma } from "@/generated/prisma/client";
import { asegurarListeners } from "@/shared/events/bus";
import { db } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";
import { reporteFallaSchema } from "../schemas";
import { descripcionDelReporte, MAXIMO_POR_HORA } from "./services/fallas";

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** "Reportar falla" (pantalla 42): se guarda en `bug_reports` con la pantalla y el celular si los dejó */
export async function reportarFalla(entrada: unknown): Promise<Resultado<{ numero: number; tuyos: number; arreglados: number }>> {
  try {
    const r = reporteFallaSchema.parse(entrada);
    const usuario = await getCurrentUser();
    if (!usuario) throw new DomainError("Entra para reportar.", "SIN_SESION");
    await asegurarListeners();
    await assertCan(usuario.id, "bug.report");
    if (!(await isEnabled("beta.bug_button"))) throw new DomainError("Reportar fallas está apagado por ahora.");
    const recientes = await db.bugReport.count({ where: { userId: usuario.id, createdAt: { gte: new Date(Date.now() - 3_600_000) } } });
    if (recientes >= MAXIMO_POR_HORA) throw new DomainError("Ya mandaste varios esta hora. Espera un ratito y mándalo.");
    await db.bugReport.create({
      data: {
        userId: usuario.id,
        path: r.pantalla ?? "(no la mandó)",
        descripcion: descripcionDelReporte(r.tipo, r.texto),
        device: (r.dispositivo ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    const [numero, tuyos, arreglados] = await Promise.all([
      db.bugReport.count(),
      db.bugReport.count({ where: { userId: usuario.id } }),
      db.bugReport.count({ where: { userId: usuario.id, status: "RESUELTO" } }),
    ]);
    return { ok: true, numero, tuyos, arreglados };
  } catch (e) {
    if (e instanceof DomainError) return { ok: false, error: e.message };
    if (e && typeof e === "object" && "issues" in e) return { ok: false, error: "Revisa lo que escribiste." };
    logger.error("reportar falla falló", { error: String(e) });
    return { ok: false, error: "Se fue la señal en la cancha. Intenta otra vez." };
  }
}
