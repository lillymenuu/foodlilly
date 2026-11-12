import { CakeSlice, CookingPot, ShoppingBag, type LucideIcon } from "lucide-react";

import type { TipoFicha, TipoItem } from "./calculo";

/** Segmento da URL de cada lista: /modulo-precificacao/receitas/massas */
export const SEGMENTOS = { massas: "massa", recheios: "recheio", produtos: "produto" } as const;
export type Segmento = keyof typeof SEGMENTOS;

export const BASE = "/modulo-precificacao/receitas";

export const INFO_TIPO: Record<
  TipoFicha,
  {
    segmento: Segmento;
    singular: string;
    plural: string;
    titulo: string;
    descricao: string;
    icone: LucideIcon;
    /** Tipos de item que a composição aceita, na ordem dos cards. */
    composicao: TipoItem[];
  }
> = {
  massa: {
    segmento: "massas",
    singular: "massa",
    plural: "massas",
    titulo: "Massas",
    descricao: "Massas de bolo, tortas, brownies e bases.",
    icone: CakeSlice,
    composicao: ["ingrediente", "receita", "mao_obra", "equipamento"],
  },
  recheio: {
    segmento: "recheios",
    singular: "recheio",
    plural: "recheios",
    titulo: "Recheios",
    descricao: "Recheios, cremes e coberturas.",
    icone: CookingPot,
    composicao: ["ingrediente", "receita", "mao_obra", "equipamento"],
  },
  produto: {
    segmento: "produtos",
    singular: "produto",
    plural: "produtos",
    titulo: "Produtos",
    descricao: "Combine receitas, insumos e embalagens para criar o que você vende.",
    icone: ShoppingBag,
    composicao: ["ingrediente", "embalagem", "receita", "produto", "mao_obra", "equipamento"],
  },
};

export const LIMITES = {
  nome: 80,
  categoria: 50,
  passos: 50,
  passo: 300,
  itens: 100,
  fichasPorNegocio: 2000,
};

export const MARGEM_PADRAO = 30;
export const MARGEM_REVENDA_PADRAO = 35;

export type CategoriaFicha = { id: string; nome: string; fichas: number };

/** Dados que a ficha envia para salvar. */
export type DadosFicha = {
  tipo: TipoFicha;
  nome: string;
  categoriaId: string | null;
  rendimento: number;
  pesoTotalG: number | null;
  tempoPreparoMin: number | null;
  margem: number | null;
  margemRevenda: number | null;
  modoPreparo: string[];
  itens: { tipo: TipoItem; refId: string; quantidade: number }[];
};
