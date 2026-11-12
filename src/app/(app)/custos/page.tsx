import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Custos fixos · foodlilly" };

export default function Page() {
  return <EmBreve title="Custos fixos" description="Aluguel, salários, energia e outros custos mensais do negócio." />;
}
