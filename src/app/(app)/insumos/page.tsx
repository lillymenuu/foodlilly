import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Insumos · foodlilly" };

export default function Page() {
  return <EmBreve title="Insumos" description="Ingredientes e embalagens, com preço de compra e rendimento." />;
}
