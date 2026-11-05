import type { Prisma } from "@/generated/prisma/client";

/**
 * Campos de una persona que SÍ pueden llegar a lo público (perfil, feed, carta).
 * NUNCA agregues aquí: celular, email, fechaNacimiento, contactoEmergencia*, authId, qrToken.
 * (Regla 8 del CLAUDE.md, con test en tests/public-user-select.test.ts)
 */
export const publicUserSelect = {
  id: true,
  username: true,
  nombre: true,
  apellidos: true,
  sobrenombre: true,
  fotoPath: true,
  bio: true,
  zona: true,
  alcaldia: true,
  facebookUrl: true,
  instagramUrl: true,
  claimedAt: true,
  isPionero: true,
  followersCount: true,
  followingCount: true,
} as const satisfies Prisma.UserSelect;

export const PRIVATE_USER_FIELDS = [
  "celular",
  "email",
  "fechaNacimiento",
  "contactoEmergenciaNom",
  "contactoEmergenciaTel",
  "authId",
  "qrToken",
] as const;
