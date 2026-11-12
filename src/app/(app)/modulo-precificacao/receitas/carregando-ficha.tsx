import { Skeleton } from "@/components/ui/skeleton";

export function CarregandoFicha() {
  return (
    <>
      <Skeleton className="h-80 rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    </>
  );
}
