import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Transferências · foodlilly" };

export default function Page() {
  return <EmBreve href="/modulo-estoque/transferencias" />;
}
