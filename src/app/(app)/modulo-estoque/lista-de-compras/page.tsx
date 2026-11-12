import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Lista de compras · foodlilly" };

export default function Page() {
  return <EmBreve href="/modulo-estoque/lista-de-compras" />;
}
