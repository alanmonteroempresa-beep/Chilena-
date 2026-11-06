import { Suspense } from "react";
import { Skeleton } from "@/shared/ui/skeleton";
import { Cascaron } from "./cascaron";

// App con sesión: header con selector de rol + barra inferior (PRD §5 · pantallas 07b, 23, 24)
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<CascaronCargando />}>
      <Cascaron>{children}</Cascaron>
    </Suspense>
  );
}

function CascaronCargando() {
  return (
    <div className="flex min-h-dvh flex-col gap-4 bg-background px-4 pt-3" aria-hidden>
      <Skeleton className="h-11 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}
