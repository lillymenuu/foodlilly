import type { Metadata } from "next";

import { ModuloHub } from "@/components/modulo-hub";

export const metadata: Metadata = { title: "Precificar · foodlilly" };

export default function Page() {
  return <ModuloHub href="/precificar" />;
}
