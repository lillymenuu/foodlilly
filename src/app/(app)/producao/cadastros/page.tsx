import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Cadastros da produção · foodlilly" };

export default function Page() {
  return <EmBreve href="/producao/cadastros" />;
}
