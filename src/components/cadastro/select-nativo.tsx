import { ChevronDown } from "lucide-react";
import { cn } from "cn";

/**
 * Seletor nativo estilizado. No celular abre o seletor do sistema, que é o
 * mais fácil de usar com o dedo.
 */
export function SelectNativo({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full scroll-mb-24 appearance-none rounded-lg border border-input bg-muted/60 pr-9 pl-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
