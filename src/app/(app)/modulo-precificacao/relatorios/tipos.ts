import type { LucideIcon } from "lucide-react";
import { Box, Cog, Soup, Users, Wheat } from "lucide-react";

/** Um produto com preço calculado, como o relatório usa (valores por unidade vendida). */
export type ProdutoRelatorio = {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  /** Custo de fabricação (custo da porção + custo fixo do Custeio). */
  custo: number;
  /** Preço − custo de fabricação. */
  lucro: number;
  /** Margem definida na ficha (%). */
  margem: number;
  composicao: Record<ChaveComposicao, number>;
};

export type ChaveComposicao =
  "ingredientes" | "embalagens" | "receitas" | "maoObra" | "equipamentos";

/**
 * Cores da composição: ordem fixa, validada para daltonismo (protan/deutan/tritan)
 * com o validador de paletas. Não reordenar sem validar de novo.
 */
export const COMPOSICAO: {
  chave: ChaveComposicao;
  rotulo: string;
  curto: string;
  cor: string;
  icone: LucideIcon;
}[] = [
  {
    chave: "ingredientes",
    rotulo: "Ingredientes",
    curto: "Ingr.",
    cor: "var(--serie-1)",
    icone: Wheat,
  },
  {
    chave: "embalagens",
    rotulo: "Embalagens",
    curto: "Emb.",
    cor: "var(--serie-2)",
    icone: Box,
  },
  {
    chave: "receitas",
    rotulo: "Receitas",
    curto: "Rec.",
    cor: "var(--serie-3)",
    icone: Soup,
  },
  {
    chave: "maoObra",
    rotulo: "Mão de obra",
    curto: "M.O.",
    cor: "var(--serie-4)",
    icone: Users,
  },
  {
    chave: "equipamentos",
    rotulo: "Equipamentos",
    curto: "Equip.",
    cor: "var(--serie-5)",
    icone: Cog,
  },
];
