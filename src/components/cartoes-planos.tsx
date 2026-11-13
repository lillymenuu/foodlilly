import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { PLANOS, type ChavePlano } from "@/config/planos";

const reais = (v: number) =>
  v.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Cartões dos planos (página inicial e Assinatura). */
export function CartoesPlanos({
  acao,
  atual,
}: {
  /** Botão de cada plano: link (ex.: cadastro) ou conteúdo próprio. */
  acao: (chave: ChavePlano) => {
    href?: string;
    rotulo: string;
    desabilitado?: boolean;
  };
  atual?: ChavePlano;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {PLANOS.map((p) => {
        const a = acao(p.chave);
        return (
          <article
            key={p.chave}
            className={cn(
              "relative flex flex-col gap-5 rounded-3xl p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 motion-reduce:hover:translate-y-0 sm:p-8",
              p.destaque
                ? "bg-gradient-to-br from-primary to-primary-strong text-primary-foreground shadow-2xl shadow-primary/30 ring-2 ring-highlight"
                : "bg-card shadow-lg ring-1 ring-foreground/10 hover:shadow-xl",
            )}
          >
            {p.destaque && (
              <span className="absolute -top-3 left-6 flex items-center gap-1 rounded-full bg-highlight px-3 py-1 text-xs font-bold text-highlight-foreground shadow-md">
                <Sparkles className="size-3.5" />
                Mais completo
              </span>
            )}
            <div>
              <h3 className="text-xl font-bold">{p.nome}</h3>
              <p
                className={cn(
                  "mt-1 text-sm",
                  p.destaque
                    ? "text-primary-foreground/75"
                    : "text-muted-foreground",
                )}
              >
                {p.para}
              </p>
            </div>
            <p className="flex items-baseline gap-1">
              <span
                className={cn(
                  "text-sm font-semibold",
                  p.destaque
                    ? "text-primary-foreground/75"
                    : "text-muted-foreground",
                )}
              >
                R$
              </span>
              <span className="text-5xl font-bold tracking-tight tabular-nums">
                {reais(p.preco)}
              </span>
              <span
                className={cn(
                  "text-sm",
                  p.destaque
                    ? "text-primary-foreground/75"
                    : "text-muted-foreground",
                )}
              >
                /mês
              </span>
            </p>
            <ul className="flex flex-1 flex-col gap-2.5 text-sm">
              {p.itens.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                      p.destaque
                        ? "bg-highlight text-highlight-foreground"
                        : "bg-success/12 text-success",
                    )}
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            {atual === p.chave && (
              <p
                className={cn(
                  "text-xs font-semibold",
                  p.destaque ? "text-highlight" : "text-success",
                )}
              >
                Plano escolhido
              </p>
            )}
            {a.href ? (
              <Button
                variant={p.destaque ? "highlight" : "default"}
                size="lg"
                className="h-12 w-full text-base"
                render={<Link href={a.href} />}
              >
                {a.rotulo}
              </Button>
            ) : (
              <Button
                variant={p.destaque ? "highlight" : "default"}
                size="lg"
                className="h-12 w-full text-base"
                disabled={a.desabilitado}
              >
                {a.rotulo}
              </Button>
            )}
          </article>
        );
      })}
    </div>
  );
}
