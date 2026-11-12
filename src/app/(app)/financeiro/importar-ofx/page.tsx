import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Importar OFX · foodlilly" };

export default function Page() {
  return <EmBreve href="/financeiro/importar-ofx" />;
}
