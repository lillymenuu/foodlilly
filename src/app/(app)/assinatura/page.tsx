import type { Metadata } from "next";
import { QrCode } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Assinatura · foodlilly" };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Assinatura"
        description="Seu plano, vencimento e pagamentos via Pix."
      />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-highlight-soft text-highlight-foreground">
            <QrCode className="size-6" />
          </span>
          <p className="font-medium">Tela em construção</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Aqui você vai acompanhar o plano e pagar a renovação por Pix.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
