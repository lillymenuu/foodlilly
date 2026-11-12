import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Gastos e recebimentos · foodlilly" };

export default function Page() {
  return <EmBreve href="/financeiro/lancamentos" />;
}
