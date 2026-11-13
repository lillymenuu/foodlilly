import {
  AO,
  AR,
  BR,
  CL,
  MZ,
  PT,
  PY,
  US,
  UY,
} from "country-flag-icons/react/3x2";
import { cn } from "cn";

const BANDEIRAS = { BR, PT, US, AR, PY, UY, CL, AO, MZ };

/** Bandeira do país em SVG (o Windows não desenha bandeiras em emoji). */
export function Bandeira({
  codigo,
  className,
}: {
  codigo: string;
  className?: string;
}) {
  const Svg = BANDEIRAS[codigo as keyof typeof BANDEIRAS] ?? BR;
  return (
    <Svg
      aria-hidden
      className={cn(
        "h-3.5 w-5 shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]",
        className,
      )}
    />
  );
}
