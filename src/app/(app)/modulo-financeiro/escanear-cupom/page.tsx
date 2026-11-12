import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Escanear cupom · foodlilly" };

export default function Page() {
  return <EmBreve href="/modulo-financeiro/escanear-cupom" />;
}
