"use client";

import { useLayoutEffect, useState } from "react";
import { ChartPie, ReceiptText, type LucideIcon } from "lucide-react";
import { cn } from "cn";

import { Aviso } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import { formatarMoeda, formatarPercentual } from "@/lib/numero-br";

import { LIMITE_ATENCAO, LIMITE_CUSTO_FIXO } from "./campos";
import { ModalResumo, type Situacao } from "./modal-resumo";

export type GrupoResumo = {
  titulo: string;
  icone: LucideIcon;
  itens: { rotulo: string; valor: number }[];
};

/** Alíquota = custos fixos ÷ receita. */
function situacaoDa(aliquota: number): Situacao {
  if (aliquota > LIMITE_CUSTO_FIXO) {
    return {
      rotulo: "Crítico",
      texto: "text-destructive",
      selo: "bg-destructive/10 text-destructive",
    };
  }
  if (aliquota > LIMITE_ATENCAO) {
    return {
      rotulo: "Atenção",
      texto: "text-amber-700",
      selo: "bg-highlight-soft text-amber-800",
    };
  }
  return {
    rotulo: "Saudável",
    texto: "text-success",
    selo: "bg-success/10 text-success",
  };
}

/** Alerta abaixo dos cards quando a alíquota passa do limite. */
export function AvisoCustoFixo({
  receita,
  totalCustos,
}: {
  receita: number;
  totalCustos: number;
}) {
  if (receita <= 0 || totalCustos / receita <= LIMITE_CUSTO_FIXO) return null;
  return (
    <Aviso tipo="erro">
      Alíquota acima de {formatarPercentual(LIMITE_CUSTO_FIXO, 0)}: os custos
      fixos estão pesando demais no faturamento. Considere reduzir custos ou
      aumentar a receita para melhorar a margem de lucro.
    </Aviso>
  );
}

export function ResumoFinanceiro({
  receita,
  totalCustos,
  grupos,
}: {
  receita: number;
  totalCustos: number;
  grupos: GrupoResumo[];
}) {
  const [aberto, setAberto] = useState(false);
  // Ao esconder a página (navegação com Cache Components), fecha o modal.
  useLayoutEffect(() => () => setAberto(false), []);
  const aliquota = receita > 0 ? totalCustos / receita : null;
  const situacao = aliquota != null ? situacaoDa(aliquota) : null;
  const critico = aliquota != null && aliquota > LIMITE_CUSTO_FIXO;
  const margem = aliquota != null ? 1 - aliquota : null;

  return (
    <>
      <section
        className={cn(
          "flex h-full flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6",
          critico && "bg-destructive/5 ring-destructive/30",
        )}
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <ReceiptText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Resumo financeiro</h2>
            <p className="text-xs text-muted-foreground">
              Custos fixos × receita do mês
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
              situacao?.selo ?? "bg-muted text-muted-foreground",
            )}
          >
            {situacao?.rotulo ?? "Informe a receita"}
          </span>
        </div>

        <dl className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Custos fixos</dt>
            <dd className="truncate text-base font-bold tabular-nums sm:text-lg">
              {formatarMoeda(totalCustos)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Alíquota</dt>
            <dd
              className={cn("text-base font-bold tabular-nums sm:text-lg", situacao?.texto)}
            >
              {aliquota != null ? formatarPercentual(aliquota) : "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Margem</dt>
            <dd
              className={cn(
                "text-base font-bold tabular-nums sm:text-lg",
                margem != null && margem >= 0
                  ? "text-success"
                  : "text-destructive",
              )}
            >
              {margem != null ? formatarPercentual(margem) : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center gap-3">
          {/* Alíquota numa barra de 0 a 50%, com a marca do limite */}
          <div className="relative flex-1" aria-hidden>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500",
                  critico
                    ? "bg-destructive"
                    : aliquota != null && aliquota > LIMITE_ATENCAO
                      ? "bg-highlight"
                      : "bg-success",
                )}
                style={{
                  width: `${Math.min(100, ((aliquota ?? 0) / 0.5) * 100)}%`,
                }}
              />
            </div>
            <span
              className="absolute -top-1 h-4 border-l border-dashed border-foreground/50"
              style={{ left: `${(LIMITE_CUSTO_FIXO / 0.5) * 100}%` }}
              title={`Limite de ${formatarPercentual(LIMITE_CUSTO_FIXO, 0)}`}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAberto(true)}
            aria-haspopup="dialog"
            className="shrink-0"
          >
            <ChartPie data-icon="inline-start" />
            Ver detalhes
          </Button>
        </div>
      </section>

      {aberto && (
        <ModalResumo
          receita={receita}
          totalCustos={totalCustos}
          grupos={grupos}
          situacao={situacao}
          onFechar={() => setAberto(false)}
        />
      )}
    </>
  );
}
