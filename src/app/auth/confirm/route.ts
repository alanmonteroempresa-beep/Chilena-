import type { NextRequest } from "next/server";
import { confirmarEntrada } from "@/modules/core/server-api";

// Regreso del link mágico (token_hash) y de Google (code). Ver modules/core/server/entrada.ts
export function GET(request: NextRequest) {
  return confirmarEntrada(request);
}
