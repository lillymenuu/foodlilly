import type { ConfigTabela, Nutrientes, Pendencia } from "@/lib/nutricao";

export const BASE_TABELA = "/modulo-precificacao/tabela-nutricional";

export type ProdutoNutricao = {
  id: string;
  nome: string;
  pesoTotalG: number | null;
  rendimento: number;
  /** Por 100 g do produto pronto (null sem peso total). */
  por100: Nutrientes | null;
  completa: boolean;
  pendencias: Pendencia[];
  /** Porção, medida caseira e lupa salvas; null = ainda não configurada. */
  config: ConfigTabela | null;
};
