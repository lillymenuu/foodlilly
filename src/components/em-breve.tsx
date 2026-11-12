import { Construction } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { buscarPagina } from "@/config/navegacao";

/** Página provisória: título e descrição vêm da configuração da navegação. */
export function EmBreve({ href }: { href: string }) {
  const { item } = buscarPagina(href);

  return (
    <>
      <PageHeader title={item.titulo} description={item.descricao} />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-highlight-soft text-highlight-foreground">
            <Construction className="size-6" />
          </span>
          <p className="font-medium">Tela em construção</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Em breve você poderá usar esta funcionalidade por aqui.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
