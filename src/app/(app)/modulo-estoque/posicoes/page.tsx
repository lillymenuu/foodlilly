import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Posições · foodlilly" };

export default function Page() {
  return <EmBreve href="/modulo-estoque/posicoes" />;
}
