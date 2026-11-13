import {
  HandCoins,
  Landmark,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Catálogo das categorias financeiras. As categorias principais são fixas (alimentam o
 * CMV e o DRE) e só entram pelas Sugestões; as subcategorias são livres.
 * Mudar uma `chave` exige migrar os dados gravados (coluna `chave` de `categorias_financeiras`).
 */
export const GRUPOS_FINANCEIROS = [
  "recebimentos",
  "operacionais",
  "variaveis",
  "pessoas",
  "impostos",
  "aquisicoes",
] as const;
export type GrupoFinanceiro = (typeof GRUPOS_FINANCEIROS)[number];

export type InfoGrupo = {
  rotulo: string;
  descricao: string;
  icone: LucideIcon;
  /** Cor do grupo (texto/ícone e fundo suave). */
  cor: string;
};

export const GRUPOS: Record<GrupoFinanceiro, InfoGrupo> = {
  recebimentos: {
    rotulo: "Recebimentos",
    descricao: "Fontes de entrada de dinheiro.",
    icone: TrendingUp,
    cor: "var(--success)",
  },
  operacionais: {
    rotulo: "Gastos operacionais",
    descricao: "Custos fixos para manter o negócio funcionando.",
    icone: Receipt,
    cor: "var(--destructive)",
  },
  variaveis: {
    rotulo: "Variáveis",
    descricao: "Gastos que sobem e descem junto com as vendas.",
    icone: ShoppingCart,
    cor: "var(--highlight-strong)",
  },
  pessoas: {
    rotulo: "Pessoas",
    descricao: "Salários, encargos e pagamentos à equipe.",
    icone: Users,
    cor: "var(--serie-1)",
  },
  impostos: {
    rotulo: "Impostos",
    descricao: "Tributos, taxas e licenças.",
    icone: Landmark,
    cor: "var(--serie-5)",
  },
  aquisicoes: {
    rotulo: "Aquisições",
    descricao: "Compras de equipamentos, investimentos e financiamentos.",
    icone: HandCoins,
    cor: "var(--cartao-petroleo)",
  },
};

export type Principal = {
  chave: string;
  nome: string;
  grupo: GrupoFinanceiro;
  sugestoes: string[];
};

export const CATALOGO: Principal[] = [
  // Recebimentos
  {
    chave: "vendas",
    grupo: "recebimentos",
    nome: "Vendas",
    sugestoes: [
      "Revendas",
      "Vendas no balcão",
      "Vendas por delivery",
      "Encomendas",
      "Vendas para empresas",
    ],
  },
  {
    chave: "receitas-nao-operacionais",
    grupo: "recebimentos",
    nome: "Receitas não operacionais",
    sugestoes: [
      "Aporte de sócios",
      "Empréstimos recebidos",
      "Rendimentos de aplicações",
      "Venda de equipamentos",
      "Outras receitas",
    ],
  },
  // Gastos operacionais
  {
    chave: "ocupacao",
    grupo: "operacionais",
    nome: "Ocupação",
    sugestoes: [
      "Aluguel",
      "Condomínio",
      "IPTU",
      "Água",
      "Energia elétrica",
      "Gás",
    ],
  },
  {
    chave: "administrativo",
    grupo: "operacionais",
    nome: "Administrativo",
    sugestoes: [
      "Contador",
      "Internet",
      "Telefone",
      "Sistemas e aplicativos",
      "Material de escritório",
      "Tarifas bancárias",
    ],
  },
  {
    chave: "marketing",
    grupo: "operacionais",
    nome: "Marketing",
    sugestoes: [
      "Anúncios on-line",
      "Redes sociais",
      "Material gráfico",
      "Brindes",
    ],
  },
  {
    chave: "manutencao",
    grupo: "operacionais",
    nome: "Manutenção e limpeza",
    sugestoes: [
      "Manutenção de equipamentos",
      "Produtos de limpeza",
      "Pequenos reparos",
      "Dedetização",
    ],
  },
  // Variáveis
  {
    chave: "cmv",
    grupo: "variaveis",
    nome: "Custo das mercadorias (CMV)",
    sugestoes: [
      "Insumos e ingredientes",
      "Embalagens",
      "Produtos para revenda",
      "Bebidas",
    ],
  },
  {
    chave: "custos-de-venda",
    grupo: "variaveis",
    nome: "Custos de venda e entrega",
    sugestoes: [
      "Taxas de aplicativos",
      "Taxas de maquininha",
      "Motoboy e frete",
      "Comissões",
    ],
  },
  // Pessoas
  {
    chave: "folha",
    grupo: "pessoas",
    nome: "Folha de pagamento",
    sugestoes: [
      "Salários",
      "Pró-labore",
      "Vale-transporte",
      "Vale-alimentação",
      "Horas extras",
      "Férias e 13º",
    ],
  },
  {
    chave: "encargos",
    grupo: "pessoas",
    nome: "Encargos trabalhistas",
    sugestoes: ["INSS", "FGTS", "Rescisões"],
  },
  {
    chave: "freelancers",
    grupo: "pessoas",
    nome: "Freelancers e diaristas",
    sugestoes: ["Diárias", "Extras de fim de semana", "Serviços avulsos"],
  },
  // Impostos
  {
    chave: "impostos-vendas",
    grupo: "impostos",
    nome: "Impostos sobre vendas",
    sugestoes: ["Simples Nacional (DAS)", "MEI (DAS)", "ICMS", "ISS"],
  },
  {
    chave: "taxas-licencas",
    grupo: "impostos",
    nome: "Taxas e licenças",
    sugestoes: [
      "Alvará de funcionamento",
      "Vigilância sanitária",
      "Taxas municipais",
      "Bombeiros",
    ],
  },
  // Aquisições
  {
    chave: "equipamentos",
    grupo: "aquisicoes",
    nome: "Equipamentos e utensílios",
    sugestoes: [
      "Fornos e fogões",
      "Refrigeração",
      "Utensílios de cozinha",
      "Móveis",
    ],
  },
  {
    chave: "investimentos",
    grupo: "aquisicoes",
    nome: "Investimentos",
    sugestoes: ["Reforma do espaço", "Tecnologia", "Veículos"],
  },
  {
    chave: "financiamentos",
    grupo: "aquisicoes",
    nome: "Financiamentos",
    sugestoes: ["Parcelas de empréstimo", "Juros e encargos"],
  },
];

export const principalPorChave = (chave: string) =>
  CATALOGO.find((p) => p.chave === chave);

/** Criadas para todo negócio que tem conta: Vendas → Revendas. */
export const PADRAO = { chave: "vendas", subcategorias: ["Revendas"] };

export const LIMITES_CATEGORIA = { nome: 60, subPorPrincipal: 50 };
