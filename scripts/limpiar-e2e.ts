// Borra lo que crean los E2E en chilena-dev: comentarios y publicaciones con la marca "[e2e]" (y corrige
// los contadores de la porra). Lo llaman los specs al terminar. Carga .env.local por dentro.
//   npx tsx scripts/limpiar-e2e.ts
import { existsSync, readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { parse } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";

const MARCA = "[e2e]";
const env = existsSync(".env.local") ? parse(readFileSync(".env.local")) : {};
if (!env.DIRECT_URL) process.exit(0);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DIRECT_URL }) });

async function main() {
  const comentarios = await db.comment.findMany({ where: { body: { startsWith: MARCA } }, select: { id: true, postId: true } });
  for (const c of comentarios) {
    if (c.postId) await db.post.update({ where: { id: c.postId }, data: { commentsCount: { decrement: 1 } } }).catch(() => {});
  }
  await db.report.deleteMany({ where: { targetId: { in: comentarios.map((c) => c.id) } } });
  await db.comment.deleteMany({ where: { id: { in: comentarios.map((c) => c.id) } } });
  const posts = await db.post.deleteMany({ where: { body: { startsWith: MARCA } } });
  console.log(`✓ limpié ${comentarios.length} comentarios y ${posts.count} publicaciones [e2e]`);
}
main().finally(() => db.$disconnect());
