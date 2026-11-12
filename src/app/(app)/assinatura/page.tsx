import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Assinatura · foodlilly" };

export default function Page() {
  return <EmBreve title="Assinatura" description="Seu plano, vencimento e pagamentos via Pix." />;
}
