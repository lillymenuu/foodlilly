import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Precificação · foodlilly" };

export default function Page() {
  return <EmBreve title="Precificação" description="Calcule o preço de venda ideal a partir do custo e da margem desejada." />;
}
