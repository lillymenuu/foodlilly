import type { Metadata } from "next";

import { ModuloHub } from "@/components/modulo-hub";

export const metadata: Metadata = { title: "Modo funcionário · foodlilly" };

export default function Page() {
  return <ModuloHub href="/modulo-funcionario" />;
}
