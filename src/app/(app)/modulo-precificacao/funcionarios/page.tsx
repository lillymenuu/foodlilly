import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Funcionários · foodlilly" };

export default function Page() {
  return <EmBreve href="/modulo-precificacao/funcionarios" />;
}
