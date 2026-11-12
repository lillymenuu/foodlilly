import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Dados de entrada · foodlilly" };

export default function Page() {
  return <EmBreve href="/precificar/dados-de-entrada" />;
}
