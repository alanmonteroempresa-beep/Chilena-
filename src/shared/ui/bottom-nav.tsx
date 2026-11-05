import { Suspense } from "react";
import { BarraInferior, BarraInferiorConRuta, type BarraInferiorProps } from "@/shared/ui/bottom-nav-barra";

/**
 * Barra inferior: Inicio · En vivo · [Publicar / Pase de lista / Capturar / Programar] · Mi liga · Perfil.
 * Con cacheComponents, `usePathname` suspende en rutas con params dinámicos: mientras tanto se pinta
 * la barra sin activo y la página sigue prerenderizada (node_modules/next/dist/docs/.../use-pathname.md).
 * Deja espacio abajo en la página: `pb-28`.
 */
export function BottomNav(props: BarraInferiorProps) {
  return (
    <Suspense fallback={<BarraInferior {...props} pathname={null} />}>
      <BarraInferiorConRuta {...props} />
    </Suspense>
  );
}
