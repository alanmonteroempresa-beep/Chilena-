import { redirect } from "next/navigation";

// Quien ya tiene sesión no llega aquí: src/proxy.ts lo manda a /auth/confirm (y de ahí a su inicio).
export default function Home() {
  redirect("/entrar");
}
