import { Skeleton } from "@/shared/ui/skeleton";

export function PerfilCargando() {
  return (
    <div className="flex flex-col gap-3 px-4 pt-4" aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </div>
      <Skeleton className="h-11 rounded-lg" />
      <Skeleton className="mx-auto h-[283px] w-[200px] rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}
