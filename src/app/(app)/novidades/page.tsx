import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Novidades · foodlilly" };

export default function Page() {
  return <EmBreve href="/novidades" />;
}
