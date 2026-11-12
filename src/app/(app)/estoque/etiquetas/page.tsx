import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Etiquetas · foodlilly" };

export default function Page() {
  return <EmBreve href="/estoque/etiquetas" />;
}
