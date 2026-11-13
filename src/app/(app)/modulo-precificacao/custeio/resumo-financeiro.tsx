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

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5 md:flex-row md:items-center",
          critico && "bg-destructive/5 ring-destructive/30",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <ReceiptText className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold">Resumo financeiro</h2>
            <p className="text-sm text-muted-foreground tabular-nums">
              Total:{" "}
              <strong className="text-foreground">
                {formatarMoeda(totalCustos)}
              </strong>
              {aliquota != null && (
                <>
                  {" · "}Margem:{" "}
                  <strong className="text-foreground">
                    {formatarPercentual(1 - aliquota)}
                  </strong>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
              situacao?.selo ?? "bg-muted text-muted-foreground",
            )}
          >
            {aliquota == null
              ? "Informe a receita"
              : `Alíquota: ${formatarPercentual(aliquota)}`}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAberto(true)}
            aria-haspopup="dialog"
          >
            <ChartPie data-icon="inline-start" />
            Ver detalhes
          </Button>
        </div>
      </div>

      {critico && (
        <Aviso tipo="erro">
          Alíquota acima de {formatarPercentual(LIMITE_CUSTO_FIXO, 0)}: os
          custos fixos estão pesando demais no faturamento. Considere reduzir
          custos ou aumentar a receita para melhorar a margem de lucro.
        </Aviso>
      )}

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
