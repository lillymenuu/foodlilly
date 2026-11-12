import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Simulador de promoções · foodlilly" };

export default function Page() {
  return <EmBreve href="/precificar/simulador" />;
}
