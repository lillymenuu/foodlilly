import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Calculator,
  ChartColumn,
  Check,
  ChefHat,
  CircleDollarSign,
  ClipboardCheck,
  Crown,
  Factory,
  GraduationCap,
  IdCard,
  Newspaper,
  Package,
  Play,
  QrCode,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard · foodlilly" };

type Servico = {
  /** [linha leve, linha em destaque]; uma linha só fica toda em destaque. */
  titulo: [string, string?];
  descricao: string;
  href: string;
  icone: LucideIcon;
  detalhe: LucideIcon;
  selo?: string;
};

const servicos: Servico[] = [
  {
    titulo: ["Precificação"],
    descricao: "Custos, receitas e preço de venda ideal.",
    href: "/modulo-precificacao",
    icone: Calculator,
    detalhe: CircleDollarSign,
  },
  {
    titulo: ["Gestão", "financeira"],
    descricao: "Lançamentos, DRE e resultado do mês.",
    href: "/financeiro",
    icone: ChartColumn,
    detalhe: TrendingUp,
  },
  {
    titulo: ["Controle de", "estoque"],
    descricao: "Saldo, transferências e lista de compras.",
    href: "/estoque",
    icone: Package,
    detalhe: Boxes,
  },
  {
    titulo: ["Produção"],
    descricao: "Planejamento e ordens de produção.",
    href: "/producao",
    icone: Factory,
    detalhe: ChefHat,
    selo: "Beta",
  },
  {
    titulo: ["Checklists"],
    descricao: "Rotinas de abertura, fechamento e limpeza.",
    href: "/checklists",
    icone: ClipboardCheck,
    detalhe: Check,
  },
  {
    titulo: ["Capacitação"],
    descricao: "Aulas para precificar e gerir melhor.",
    href: "/capacitacao",
    icone: GraduationCap,
    detalhe: Play,
  },
  {
    titulo: ["Módulo", "etiquetas"],
    descricao: "Etiquetas de validade e identificação.",
    href: "/estoque/etiquetas",
    icone: Tag,
    detalhe: QrCode,
  },
  {
    titulo: ["Modo", "funcionário"],
    descricao: "Acesso da equipe, escalas e setores.",
    href: "/equipe",
    icone: IdCard,
    detalhe: Users,
  },
  {
    titulo: ["Novidades"],
    descricao: "O que mudou no foodlilly.",
    href: "/novidades",
    icone: Newspaper,
    detalhe: Sparkles,
  },
];

// Dados fixos até a autenticação existir.
const usuario = { nome: "Ana", plano: "Plano mensal", validoAte: "23/11/2026" };

export default function DashboardPage() {
  return (
    <>
      <section className="relative overflow-hidden rounded-2xl bg-primary px-6 py-7 text-primary-foreground sm:px-8 sm:py-8">
        {/* Detalhes decorativos */}
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-highlight/15" />
        <div aria-hidden className="pointer-events-none absolute -right-4 -bottom-28 size-56 rounded-full border-[28px] border-white/5" />
        <ChefHat aria-hidden className="pointer-events-none absolute right-10 bottom-6 hidden size-28 -rotate-12 text-white/10 md:block" />

        <div className="relative flex flex-col gap-4 md:max-w-xl">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Olá, <span className="text-highlight">{usuario.nome}</span>{" "}
            <span aria-hidden>👋</span>
          </h1>
          <p className="text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
            Explore os módulos e aproveite ao máximo o foodlilly. Ficou com
            dúvida? Veja as aulas em{" "}
            <Link href="/capacitacao" className="font-medium text-white underline underline-offset-4">
              Capacitação
            </Link>
            .
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15">
              <Crown className="size-3.5 text-highlight" />
              {usuario.plano}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Ativo até {usuario.validoAte}
            </span>
          </div>
        </div>

        <Button
          variant="highlight"
          render={<Link href="/modulo-precificacao" />}
          className="relative mt-5 md:absolute md:top-6 md:right-6 md:mt-0"
        >
          Calcular preço
          <ArrowRight data-icon="inline-end" />
        </Button>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-4 text-highlight-strong" />
          Serviços disponíveis
        </h2>
        {/* 3 colunas só a partir de 1280px: abaixo disso, com o menu aberto, o texto fica espremido. */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {servicos.map((servico) => (
            <CardServico key={servico.href} servico={servico} />
          ))}
        </div>
      </section>
    </>
  );
}

function CardServico({ servico }: { servico: Servico }) {
  const [linha1, linha2] = servico.titulo;

  return (
    <Link
      href={servico.href}
      className="group flex min-h-36 items-center gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 hover:ring-highlight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="min-w-0 flex-1">
        {servico.selo && (
          <span className="mb-2 inline-flex rounded bg-highlight px-1.5 py-px text-[10px] font-semibold uppercase text-highlight-foreground">
            {servico.selo}
          </span>
        )}
        <h3 className="text-lg leading-tight tracking-tight">
          {linha2 ? (
            <>
              <span className="block text-muted-foreground">{linha1}</span>
              <span className="block font-semibold">{linha2}</span>
            </>
          ) : (
            <span className="block font-semibold">{linha1}</span>
          )}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{servico.descricao}</p>
      </div>

      {/* Ilustração: ícone principal + detalhe em laranja */}
      <div aria-hidden className="relative size-20 shrink-0">
        <div className="absolute inset-0 flex rotate-6 items-center justify-center rounded-2xl bg-primary-soft transition-transform duration-300 group-hover:rotate-0">
          <servico.icone className="size-9 -rotate-6 text-primary transition-transform duration-300 group-hover:rotate-0" />
        </div>
        <span className="absolute -right-1.5 -bottom-1.5 flex size-8 items-center justify-center rounded-full bg-highlight text-highlight-foreground ring-4 ring-card">
          <servico.detalhe className="size-4" />
        </span>
      </div>
    </Link>
  );
}
