import type { Metadata } from "next";

import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Capacitação · foodlilly" };

export default function Page() {
  return <EmBreve href="/capacitacao" />;
}
