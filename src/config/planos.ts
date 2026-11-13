/**
 * Planos de assinatura: fonte única para a página inicial, o cadastro e a Assinatura.
 * Itens de cada plano são provisórios: ajustar aqui quando forem definidos.
 */
export type ChavePlano = "basico" | "completo";

export type Plano = {
  chave: ChavePlano;
  nome: string;
  /** Preço mensal em reais. */
  preco: number;
  para: string;
  itens: string[];
  destaque?: boolean;
};

export const PLANOS: Plano[] = [
  {
    chave: "basico",
    nome: "Gestão Básico",
    preco: 32.32,
    para: "Para quem está organizando os preços.",
    itens: [
      "Até 100 insumos e 100 produtos",
      "Fichas técnicas com custo, margem e preço",
      "Custeio, mão de obra e equipamentos",
      "Relatórios com gráficos e PDF",
      "Funciona no celular e no computador",
    ],
  },
  {
    chave: "completo",
    nome: "Gestão Completa",
    preco: 49.99,
    para: "Para quem quer o sistema inteiro, sem limites.",
    destaque: true,
    itens: [
      "Tudo do Gestão Básico",
      "Insumos, receitas e produtos ilimitados",
      "Novos módulos incluídos assim que lançados",
      "Suporte prioritário pelo WhatsApp",
    ],
  },
];

export const planoPorChave = (c: string | null | undefined) =>
  PLANOS.find((p) => p.chave === c) ?? PLANOS[0];

/** Dias de teste grátis (mesmo valor usado no cadastro). */
export const DIAS_TESTE_GRATIS = 7;
