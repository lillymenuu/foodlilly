import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Página não encontrada · foodlilly" };

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-highlight-soft text-highlight-foreground">
        <SearchX className="size-7" />
      </span>
      <p className="text-sm font-semibold text-muted-foreground">Erro 404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="max-w-sm text-muted-foreground">
        O endereço pode ter mudado ou não existe mais. Volte para o início e
        navegue pelo menu.
      </p>
      <Button size="lg" render={<Link href="/inicio" />} className="mt-2">
        <ArrowLeft data-icon="inline-start" />
        Voltar para o início
      </Button>
    </main>
  );
}
