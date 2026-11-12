import {
  Archive,
  ArrowLeftRight,
  Calculator,
  CalendarClock,
  ChartColumn,
  ChefHat,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Cog,
  Database,
  Factory,
  FileText,
  GraduationCap,
  LayoutDashboard,
  IdCard,
  Landmark,
  Layers,
  ListOrdered,
  MapPin,
  Newspaper,
  Package,
  ScanLine,
  ScrollText,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Tag,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  Wheat,
  type LucideIcon,
} from "lucide-react";

/**
 * Fonte única da navegação da área do cliente: menu lateral, breadcrumb e
 * páginas centrais dos módulos leem daqui. Para criar uma tela nova, adicione
 * o item aqui e crie o page.tsx na rota correspondente.
 */

export type Pagina = {
  titulo: string;
  href: string;
  icone: LucideIcon;
  descricao: string;
  /** Agrupa os cards na página central do módulo. */
  grupo?: string;
  /** Aparece no menu com cadeado, sem link (funcionalidade futura). */
  bloqueado?: boolean;
};

export type Modulo = Pagina & {
  selo?: string;
  paginas?: Pagina[];
};

export const navegacao: Modulo[] = [
  {
    titulo: "Dashboard",
    href: "/dashboard",
    icone: LayoutDashboard,
    descricao: "Resumo do seu negócio.",
  },
  {
    titulo: "Capacitação",
    href: "/capacitacao",
    icone: GraduationCap,
    descricao: "Aulas e materiais para aprender a precificar e gerir melhor.",
  },
  {
    titulo: "Precificar",
    href: "/precificar",
    icone: CircleDollarSign,
    descricao: "Custos, receitas e preços de venda do seu negócio.",
    paginas: [
      {
        titulo: "Dados de entrada",
        href: "/precificar/dados-de-entrada",
        icone: Database,
        descricao: "Faturamento, impostos, taxas e metas de lucro.",
        grupo: "Dados necessários",
      },
      {
        titulo: "Custeio",
        href: "/precificar/custeio",
        icone: Calculator,
        descricao: "Custos fixos mensais do negócio.",
        grupo: "Dados necessários",
      },
      {
        titulo: "Equipamentos",
        href: "/precificar/equipamentos",
        icone: Cog,
        descricao: "Máquinas e utensílios, com consumo e depreciação.",
        grupo: "Dados necessários",
      },
      {
        titulo: "Funcionários",
        href: "/precificar/funcionarios",
        icone: Users,
        descricao: "Equipe, salários e custo da mão de obra.",
        grupo: "Dados necessários",
      },
      {
        titulo: "Insumos",
        href: "/precificar/insumos",
        icone: Wheat,
        descricao: "Ingredientes e embalagens com preço de compra.",
        grupo: "Dados necessários",
      },
      {
        titulo: "Receitas e produtos",
        href: "/precificar/receitas",
        icone: ChefHat,
        descricao: "Fichas técnicas, custo e preço de venda.",
        grupo: "Dados necessários",
      },
      {
        titulo: "Simulador de promoções",
        href: "/precificar/simulador",
        icone: Sparkles,
        descricao: "Monte combos e descontos sem perder margem.",
        grupo: "Ferramentas",
      },
      {
        titulo: "Relatórios",
        href: "/precificar/relatorios",
        icone: FileText,
        descricao: "Margens, custos e preços em gráficos.",
        grupo: "Ferramentas",
      },
    ],
  },
  {
    titulo: "Estoque",
    href: "/estoque",
    icone: Package,
    descricao: "Entradas, saídas e posição de insumos e produtos.",
    paginas: [
      {
        titulo: "Estoque de insumos",
        href: "/estoque/insumos",
        icone: Wheat,
        descricao: "Saldo de ingredientes e embalagens.",
      },
      {
        titulo: "Estoque de preparações",
        href: "/estoque/preparacoes",
        icone: ChefHat,
        descricao: "Massas, recheios e bases já preparados.",
      },
      {
        titulo: "Estoque de produtos",
        href: "/estoque/produtos",
        icone: ShoppingBag,
        descricao: "Produtos prontos para venda.",
      },
      {
        titulo: "Posições",
        href: "/estoque/posicoes",
        icone: MapPin,
        descricao: "Locais de armazenamento: geladeira, freezer, despensa.",
      },
      {
        titulo: "Responsáveis",
        href: "/estoque/responsaveis",
        icone: Users,
        descricao: "Quem pode movimentar o estoque.",
      },
      {
        titulo: "Transferências",
        href: "/estoque/transferencias",
        icone: ArrowLeftRight,
        descricao: "Movimentações entre posições.",
      },
      {
        titulo: "Relatório",
        href: "/estoque/relatorio",
        icone: ClipboardList,
        descricao: "Histórico de movimentações e valor em estoque.",
      },
      {
        titulo: "Lista de compras",
        href: "/estoque/lista-de-compras",
        icone: ShoppingCart,
        descricao: "O que comprar com base no estoque mínimo.",
      },
      {
        titulo: "Etiquetas",
        href: "/estoque/etiquetas",
        icone: Tag,
        descricao: "Etiquetas de validade e identificação.",
      },
    ],
  },
  {
    titulo: "Financeiro",
    href: "/financeiro",
    icone: Wallet,
    descricao: "Contas, lançamentos e resultado do negócio.",
    paginas: [
      {
        titulo: "Contas e categorias",
        href: "/financeiro/contas",
        icone: Landmark,
        descricao: "Contas bancárias, caixa e categorias.",
      },
      {
        titulo: "Gastos e recebimentos",
        href: "/financeiro/lancamentos",
        icone: TrendingUp,
        descricao: "Entradas e saídas do dia a dia.",
      },
      {
        titulo: "DRE",
        href: "/financeiro/dre",
        icone: ChartColumn,
        descricao: "Demonstrativo de resultado do período.",
      },
      {
        titulo: "Gráficos e relatórios",
        href: "/financeiro/relatorios",
        icone: FileText,
        descricao: "Evolução de receitas, despesas e lucro.",
      },
      {
        titulo: "Importar OFX",
        href: "/financeiro/importar-ofx",
        icone: Upload,
        descricao: "Importe o extrato do banco.",
      },
      {
        titulo: "Escanear cupom",
        href: "/financeiro/escanear-cupom",
        icone: ScanLine,
        descricao: "Lance uma compra fotografando o cupom fiscal.",
      },
    ],
  },
  {
    titulo: "Produção",
    href: "/producao",
    icone: Factory,
    descricao: "Planejamento e controle da produção.",
    selo: "Beta",
    paginas: [
      {
        titulo: "Meu dia",
        href: "/producao/meu-dia",
        icone: Sun,
        descricao: "O que produzir hoje.",
        bloqueado: true,
      },
      {
        titulo: "Ordens",
        href: "/producao/ordens",
        icone: ListOrdered,
        descricao: "Ordens de produção.",
        bloqueado: true,
      },
      {
        titulo: "Cadastros",
        href: "/producao/cadastros",
        icone: SlidersHorizontal,
        descricao: "Configurações da produção.",
      },
      {
        titulo: "Relatórios",
        href: "/producao/relatorios",
        icone: FileText,
        descricao: "Indicadores da produção.",
        bloqueado: true,
      },
      {
        titulo: "Histórico",
        href: "/producao/historico",
        icone: Archive,
        descricao: "Produções anteriores.",
        bloqueado: true,
      },
    ],
  },
  {
    titulo: "Checklists",
    href: "/checklists",
    icone: ClipboardCheck,
    descricao: "Rotinas de abertura, fechamento e limpeza.",
  },
  {
    titulo: "Modo funcionário",
    href: "/equipe",
    icone: IdCard,
    descricao: "Acesso da equipe, escalas e atividades.",
    paginas: [
      {
        titulo: "Funcionários",
        href: "/equipe/funcionarios",
        icone: Users,
        descricao: "Cadastro e acesso de cada pessoa da equipe.",
      },
      {
        titulo: "Gestor de escala",
        href: "/equipe/escala",
        icone: CalendarClock,
        descricao: "Turnos e folgas da equipe.",
      },
      {
        titulo: "Setores",
        href: "/equipe/setores",
        icone: Layers,
        descricao: "Cozinha, salão, caixa e outros setores.",
      },
      {
        titulo: "Sessões",
        href: "/equipe/sessoes",
        icone: Clock,
        descricao: "Quem está conectado e em qual aparelho.",
      },
      {
        titulo: "Atividade",
        href: "/equipe/atividade",
        icone: ScrollText,
        descricao: "Registro do que cada pessoa fez no sistema.",
      },
    ],
  },
  {
    titulo: "Novidades",
    href: "/novidades",
    icone: Newspaper,
    descricao: "O que mudou no foodlilly.",
  },
];

/** Encontra o módulo e a página (se houver) correspondentes a uma rota. */
export function encontrarRota(pathname: string) {
  for (const modulo of navegacao) {
    for (const pagina of modulo.paginas ?? []) {
      if (pathname === pagina.href || pathname.startsWith(`${pagina.href}/`)) {
        return { modulo, pagina };
      }
    }
    if (pathname === modulo.href || pathname.startsWith(`${modulo.href}/`)) {
      return { modulo, pagina: undefined };
    }
  }
  return undefined;
}

export function buscarModulo(href: string) {
  const modulo = navegacao.find((m) => m.href === href);
  if (!modulo) throw new Error(`Módulo não encontrado na navegação: ${href}`);
  return modulo;
}

export function buscarPagina(href: string) {
  const achado = encontrarRota(href);
  const item = achado?.pagina ?? achado?.modulo;
  if (!item || item.href !== href) {
    throw new Error(`Página não encontrada na navegação: ${href}`);
  }
  return { ...achado, item };
}
