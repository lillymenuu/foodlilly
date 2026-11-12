import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Receitas e produtos · foodlilly" };

export default function Page() {
  return <EmBreve href="/precificar/receitas" />;
}
