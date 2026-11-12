import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Receitas · foodlilly" };

export default function Page() {
  return <EmBreve title="Receitas" description="Fichas técnicas com os insumos e o custo de cada receita." />;
}
