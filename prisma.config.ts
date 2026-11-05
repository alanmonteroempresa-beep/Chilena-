import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js usa .env.local; Prisma CLI también lo lee desde aquí.
config({ path: ".env.local" });
config();

// Prisma 7: la URL ya no va en schema.prisma.
// DIRECT_URL = conexión directa (puerto 5432) para migraciones.
// La app usa DATABASE_URL (pooler, puerto 6543) vía @prisma/adapter-pg en src/shared/lib/db.ts.
// El placeholder permite correr `prisma generate` sin base de datos (CI).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
