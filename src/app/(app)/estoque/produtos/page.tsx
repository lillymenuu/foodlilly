import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Estoque de produtos · foodlilly" };

export default function Page() {
  return <EmBreve href="/estoque/produtos" />;
}
