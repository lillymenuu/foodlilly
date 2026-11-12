import Link from "next/link";
import { ArrowRight, ChefHat } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-primary px-6 py-24 text-center text-primary-foreground">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-highlight text-highlight-foreground">
        <ChefHat className="size-8" />
      </span>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        foodlilly
      </h1>
      <p className="max-w-md text-lg leading-8 text-primary-foreground/80">
        Precificação inteligente para o seu negócio de alimentação.
      </p>
      <span className="rounded-full border border-primary-foreground/20 px-3 py-1 text-sm text-primary-foreground/70">
        Em construção
      </span>
      <Button variant="highlight" size="lg" render={<Link href="/inicio" />}>
        Ver prévia do sistema
        <ArrowRight data-icon="inline-end" />
      </Button>
    </main>
  );
}
