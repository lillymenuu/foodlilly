import type { Metadata } from "next";

import { ModuloHub } from "@/components/modulo-hub";

export const metadata: Metadata = { title: "Estoque · foodlilly" };

export default function Page() {
  return <ModuloHub href="/modulo-estoque" />;
}
