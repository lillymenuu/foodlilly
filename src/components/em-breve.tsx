import { Construction } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

// Página provisória para itens do menu que ainda serão definidos no escopo.
export function EmBreve({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-highlight-soft text-highlight-foreground">
            <Construction className="size-6" />
          </span>
          <p className="font-medium">Tela em construção</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            O conteúdo desta tela será definido no documento de escopo.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
