import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Bike,
  CalendarCheck,
  ChartPie,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  CookingPot,
  CreditCard,
  FileText,
  Flame,
  Lock,
  Package,
  Receipt,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Users,
  Wheat,
  type LucideIcon,
} from "lucide-react";

import { Logo } from "@/components/acesso";
import { CartoesPlanos } from "@/components/cartoes-planos";
import {
  CabecalhoLanding,
  LinkCadastro,
  Revelar,
  SimuladorPreco,
} from "@/components/landing/interativos";
import { DIAS_TESTE_GRATIS } from "@/config/planos";

export const metadata: Metadata = {
  title: "foodlilly · Precificação para negócios de alimentação",
  description:
    "Calcule o preço certo de cada produto com todos os custos: ingredientes, embalagem, mão de obra, custos fixos e taxas. Teste 7 dias grátis.",
};

const reais = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Exemplo ilustrativo do "lucro de cabeça × lucro de verdade" (bolo de pote a R$ 12,00).
const PRECO_EXEMPLO = 12;
const CUSTOS_ESQUECIDOS = [
  { rotulo: "Ingredientes", valor: 4.8, icone: Wheat },
  { rotulo: "Embalagem", valor: 0.9, icone: Package },
  { rotulo: "Mão de obra", valor: 1.2, icone: Users },
  { rotulo: "Gás e energia", valor: 0.3, icone: Flame },
  { rotulo: "Custos fixos do mês", valor: 1.44, icone: Receipt },
  { rotulo: "Impostos e taxas", valor: 0.84, icone: CreditCard },
];
const lucroCabeca = PRECO_EXEMPLO - CUSTOS_ESQUECIDOS[0].valor;
const lucroReal =
  PRECO_EXEMPLO - CUSTOS_ESQUECIDOS.reduce((s, c) => s + c.valor, 0);

const RECURSOS: {
  icone: LucideIcon;
  titulo: string;
  texto: string;
  itens: string[];
}[] = [
  {
    icone: FileText,
    titulo: "Fichas técnicas completas",
    texto:
      "Receitas e produtos com ingredientes, embalagens, mão de obra e equipamentos.",
    itens: [
      "Custo por porção e por kg",
      "CMV em tempo real",
      "Receitas dentro de produtos",
    ],
  },
  {
    icone: Target,
    titulo: "Preço certo em cada canal",
    texto:
      "Balcão, maquininha, revenda e apps de entrega, cada um com o seu preço.",
    itens: [
      "Margem que você escolhe",
      "Taxas de iFood, 99Food e Keeta",
      "Classificação da margem",
    ],
  },
  {
    icone: Receipt,
    titulo: "Custos fixos no lugar certo",
    texto:
      "Aluguel, energia, salários e sistemas entram no preço de cada produto.",
    itens: [
      "Alíquota de custo fixo",
      "Alerta quando passa do limite",
      "Resumo com gráficos",
    ],
  },
  {
    icone: ChartPie,
    titulo: "Relatórios que mostram onde agir",
    texto: "Margens, custos e composição de todos os produtos de uma vez.",
    itens: ["Maior e menor margem", "Gráficos interativos", "Relatório em PDF"],
  },
];

const EM_BREVE = [
  "Estoque e lista de compras",
  "Gestão financeira",
  "Produção",
  "Checklists da cozinha",
];

const PERGUNTAS = [
  {
    p: "Como funcionam os 7 dias grátis?",
    r: "Você cria a conta e usa todos os recursos por 7 dias, sem cartão de crédito. No fim do teste nada é cobrado automaticamente: se quiser continuar, escolhe um plano e paga por Pix.",
  },
  {
    p: "Preciso entender de tecnologia?",
    r: "Não. Você preenche o que já sabe (o preço que paga nos ingredientes, quanto rende a receita, seus custos do mês) e o foodlilly faz as contas. Já vem com valores de exemplo para você ajustar.",
  },
  {
    p: "Já uso planilha. Por que trocar?",
    r: "Na planilha, quando o preço do leite muda, você precisa refazer tudo. No foodlilly, o custo de todas as receitas e produtos que usam aquele ingrediente é recalculado na hora, com margem e preço para cada canal de venda.",
  },
  {
    p: "Funciona no celular?",
    r: "Sim. O foodlilly funciona no navegador do celular, do tablet e do computador, sem instalar nada.",
  },
  {
    p: "Como é feito o pagamento?",
    r: "Por Pix, mensalmente. Você paga quando quiser renovar: não existe cobrança automática nem fidelidade.",
  },
  {
    p: "Meus dados estão seguros?",
    r: "Seus dados ficam guardados com segurança e só você tem acesso a eles com seu login. Não vendemos nem compartilhamos suas informações. Veja a nossa Política de Privacidade.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background [scroll-behavior:smooth]">
      <CabecalhoLanding />

      {/* ------------------------------------------------ Topo */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-strong via-primary to-primary px-4 pt-32 pb-20 text-primary-foreground sm:px-6 sm:pt-40 sm:pb-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-[-10%] size-[36rem] rounded-full bg-highlight/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-30%] left-[-10%] size-[30rem] rounded-full bg-sky-400/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.07)_1px,transparent_0)] [background-size:28px_28px]"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium ring-1 ring-white/15 backdrop-blur animate-in fade-in slide-in-from-bottom-2 duration-700">
              <CookingPot className="size-3.5 text-highlight" />
              Para confeitarias, padarias, lanchonetes e marmitarias
            </span>
            <h1 className="text-4xl leading-[1.05] font-bold tracking-tight animate-in fade-in slide-in-from-bottom-3 duration-700 sm:text-6xl">
              Preço certo,
              <br />
              <span className="bg-gradient-to-r from-highlight to-amber-300 bg-clip-text text-transparent">
                lucro de verdade.
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-primary-foreground/80 animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:120ms] [animation-fill-mode:both]">
              O foodlilly junta ingredientes, embalagem, mão de obra, custos
              fixos e taxas de cada produto e mostra o preço que garante a sua
              margem, no balcão e nos apps de entrega.
            </p>
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:240ms] [animation-fill-mode:both] sm:flex-row sm:items-center">
              <LinkCadastro>Começar meu teste grátis</LinkCadastro>
              <Link
                href="/entrar"
                className="rounded-lg px-2 py-2 text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
              >
                Já tenho conta · Entrar
              </Link>
            </div>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-foreground/70">
              {[
                `${DIAS_TESTE_GRATIS} dias grátis`,
                "Sem cartão de crédito",
                "Pagamento por Pix",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <BadgeCheck className="size-4 text-highlight" />
                  {t}
                </span>
              ))}
            </p>
          </div>

          <MockupFicha />
        </div>
      </section>

      {/* ------------------------------------------------ Lucro de cabeça × de verdade */}
      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Revelar className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-highlight-strong uppercase">
              O custo que ninguém vê
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              O lucro que você imagina não é o lucro que sobra
            </h2>
            <p className="mt-4 text-muted-foreground">
              Quem desconta só os ingredientes esquece mais da metade dos
              custos. Veja um bolo de pote vendido a {reais(PRECO_EXEMPLO)}:
            </p>
          </Revelar>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <Revelar>
              <article className="flex h-full flex-col gap-5 rounded-3xl bg-card p-6 shadow-lg ring-1 ring-foreground/10 sm:p-8">
                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  A conta de cabeça
                </p>
                <BarraConta itens={[CUSTOS_ESQUECIDOS[0]]} />
                <Linha rotulo="Preço de venda" valor={reais(PRECO_EXEMPLO)} />
                <Linha
                  rotulo="− Ingredientes"
                  valor={reais(CUSTOS_ESQUECIDOS[0].valor)}
                />
                <div className="mt-auto flex items-end justify-between rounded-2xl bg-muted p-4">
                  <span className="text-sm text-muted-foreground">
                    Lucro que você imagina
                  </span>
                  <span className="text-3xl font-bold tabular-nums">
                    {reais(lucroCabeca)}
                  </span>
                </div>
              </article>
            </Revelar>
            <Revelar atraso={150}>
              <article className="flex h-full flex-col gap-5 rounded-3xl bg-primary p-6 text-primary-foreground shadow-2xl shadow-primary/30 sm:p-8">
                <p className="text-xs font-bold tracking-wider text-highlight uppercase">
                  A conta completa
                </p>
                <BarraConta itens={CUSTOS_ESQUECIDOS} escura />
                <ul className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {CUSTOS_ESQUECIDOS.map((c) => (
                    <li
                      key={c.rotulo}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2 text-primary-foreground/80">
                        <c.icone className="size-4 text-highlight" />
                        {c.rotulo}
                      </span>
                      <span className="tabular-nums">{reais(c.valor)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-end justify-between rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                  <span className="text-sm text-primary-foreground/80">
                    Lucro de verdade
                  </span>
                  <span className="text-3xl font-bold text-highlight tabular-nums">
                    {reais(lucroReal)}
                  </span>
                </div>
              </article>
            </Revelar>
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Números ilustrativos. O foodlilly faz essa conta com os seus custos,
            produto por produto.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------ Como funciona */}
      <section
        id="como-funciona"
        className="scroll-mt-20 bg-card px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <Revelar className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-highlight-strong uppercase">
              Como funciona
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Seu preço certo em 3 passos
            </h2>
          </Revelar>
          <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_1fr_1.15fr] lg:items-start">
            {[
              {
                n: 1,
                icone: Wheat,
                titulo: "Cadastre seus insumos",
                texto:
                  "Com o preço que você paga e o tamanho da embalagem. O custo de cada grama ou unidade sai na hora, já com a perda.",
              },
              {
                n: 2,
                icone: ClipboardList,
                titulo: "Monte a ficha técnica",
                texto:
                  "Diga o que vai na receita, quanto rende e quanto tempo leva. Mão de obra, gás e energia entram sozinhos.",
              },
            ].map((p, i) => (
              <Revelar key={p.n} atraso={i * 120}>
                <article className="group flex h-full flex-col gap-4 rounded-3xl bg-background p-6 ring-1 ring-foreground/5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:hover:translate-y-0 sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-transform duration-300 group-hover:rotate-6">
                      <p.icone className="size-6" />
                    </span>
                    <span className="text-5xl font-bold text-foreground/10">
                      0{p.n}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold">{p.titulo}</h3>
                  <p className="text-muted-foreground">{p.texto}</p>
                </article>
              </Revelar>
            ))}
            <Revelar atraso={240}>
              <article className="flex h-full flex-col gap-4 rounded-3xl bg-background p-6 shadow-xl ring-2 ring-highlight/60 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-highlight text-highlight-foreground">
                    <Target className="size-6" />
                  </span>
                  <span className="text-5xl font-bold text-foreground/10">
                    03
                  </span>
                </div>
                <h3 className="text-xl font-semibold">
                  Escolha a margem e veja o preço
                </h3>
                <p className="text-sm text-muted-foreground">
                  Experimente aqui mesmo:
                </p>
                <SimuladorPreco />
              </article>
            </Revelar>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Recursos */}
      <section
        id="recursos"
        className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <Revelar className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-highlight-strong uppercase">
              Recursos
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Menos planilha, mais resultado
            </h2>
            <p className="mt-4 text-muted-foreground">
              Tudo o que você precisa para precificar com segurança, num lugar
              só.
            </p>
          </Revelar>
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {RECURSOS.map((r, i) => (
              <Revelar key={r.titulo} atraso={(i % 2) * 120}>
                <article className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:hover:translate-y-0 sm:p-8">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-highlight/10 transition-transform duration-500 group-hover:scale-125"
                  />
                  <span className="relative flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <r.icone className="size-6" />
                  </span>
                  <div className="relative">
                    <h3 className="text-xl font-semibold">{r.titulo}</h3>
                    <p className="mt-1 text-muted-foreground">{r.texto}</p>
                  </div>
                  <ul className="relative mt-auto flex flex-wrap gap-2">
                    {r.itens.map((t) => (
                      <li
                        key={t}
                        className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </article>
              </Revelar>
            ))}
          </div>
          <Revelar>
            <div className="mt-6 flex flex-col items-start gap-3 rounded-3xl bg-primary-soft/60 p-6 sm:flex-row sm:items-center sm:p-8">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-highlight text-highlight-foreground">
                <Sparkles className="size-6" />
              </span>
              <div className="flex-1">
                <h3 className="font-semibold">Em breve no foodlilly</h3>
                <p className="text-sm text-muted-foreground">
                  Novos módulos chegando, usando os mesmos cadastros que você já
                  fez.
                </p>
              </div>
              <ul className="flex flex-wrap gap-2">
                {EM_BREVE.map((t) => (
                  <li
                    key={t}
                    className="rounded-full bg-card px-3 py-1 text-xs font-medium ring-1 ring-foreground/10"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Revelar>
          <Revelar className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                icone: Smartphone,
                t: "No celular e no computador",
                d: "Sem instalar nada.",
              },
              {
                icone: Lock,
                t: "Seus dados protegidos",
                d: "Acesso só com o seu login.",
              },
              {
                icone: Rocket,
                t: "Comece em minutos",
                d: "Já vem com valores de exemplo.",
              },
            ].map((x) => (
              <div
                key={x.t}
                className="flex items-center gap-3 rounded-2xl p-2"
              >
                <x.icone className="size-6 shrink-0 text-highlight-strong" />
                <div>
                  <p className="text-sm font-semibold">{x.t}</p>
                  <p className="text-sm text-muted-foreground">{x.d}</p>
                </div>
              </div>
            ))}
          </Revelar>
        </div>
      </section>

      {/* ------------------------------------------------ Teste + planos */}
      <section
        id="planos"
        className="scroll-mt-20 bg-card px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="mx-auto max-w-5xl">
          <Revelar className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-highlight-strong uppercase">
              Planos
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Teste {DIAS_TESTE_GRATIS} dias. Depois, escolha.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Sem cartão de crédito e sem cobrança automática no fim do teste.
            </p>
          </Revelar>

          <Revelar>
            <ol className="relative mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-3">
              <span
                aria-hidden
                className="absolute top-6 right-[16%] left-[16%] hidden h-0.5 bg-gradient-to-r from-highlight via-primary/40 to-primary/20 sm:block"
              />
              {[
                {
                  icone: Rocket,
                  t: "Hoje",
                  d: "Crie a conta e use tudo, sem cartão.",
                },
                {
                  icone: CalendarCheck,
                  t: `Dia ${DIAS_TESTE_GRATIS}`,
                  d: "O teste termina. Nada é cobrado sozinho.",
                },
                {
                  icone: CircleDollarSign,
                  t: "Depois",
                  d: "Escolha um plano e pague por Pix.",
                },
              ].map((x) => (
                <li
                  key={x.t}
                  className="relative flex flex-col items-center gap-2 text-center"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-card">
                    <x.icone className="size-5" />
                  </span>
                  <p className="font-semibold">{x.t}</p>
                  <p className="text-sm text-muted-foreground">{x.d}</p>
                </li>
              ))}
            </ol>
          </Revelar>

          <Revelar className="mt-14">
            <CartoesPlanos
              acao={(chave) => ({
                href: `/cadastro?plano=${chave}`,
                rotulo: `Testar grátis por ${DIAS_TESTE_GRATIS} dias`,
              })}
            />
          </Revelar>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Sem fidelidade: você paga por Pix só quando quiser continuar.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------ Dúvidas */}
      <section
        id="duvidas"
        className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="mx-auto max-w-3xl">
          <Revelar className="text-center">
            <p className="text-sm font-semibold tracking-wide text-highlight-strong uppercase">
              Dúvidas
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Perguntas frequentes
            </h2>
          </Revelar>
          <div className="mt-10 flex flex-col gap-3">
            {PERGUNTAS.map((q, i) => (
              <Revelar key={q.p} atraso={i * 60}>
                <details className="group rounded-2xl bg-card ring-1 ring-foreground/10 transition-shadow open:shadow-lg">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                    {q.p}
                    <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-muted-foreground">{q.r}</p>
                </details>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Chamada final */}
      <section className="px-4 pb-20 sm:px-6">
        <Revelar className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-primary-strong px-6 py-14 text-center text-primary-foreground shadow-2xl shadow-primary/30 sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-highlight/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -bottom-24 size-80 rounded-full bg-sky-400/10 blur-3xl"
          />
          <div className="relative flex flex-col items-center gap-5">
            <ShieldCheck className="size-10 text-highlight" />
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
              Descubra hoje quanto você lucra de verdade
            </h2>
            <p className="max-w-xl text-primary-foreground/80">
              Comece com os seus produtos de verdade. Em poucos minutos você
              sabe se o seu preço paga as contas.
            </p>
            <LinkCadastro>Testar {DIAS_TESTE_GRATIS} dias grátis</LinkCadastro>
          </div>
        </Revelar>
      </section>

      <footer className="border-t bg-card px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <nav
            aria-label="Links legais"
            className="flex flex-wrap justify-center gap-x-6 gap-y-2"
          >
            <Link href="/termos" className="hover:text-foreground">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-foreground">
              Política de Privacidade
            </Link>
            <Link href="/entrar" className="hover:text-foreground">
              Entrar
            </Link>
          </nav>
          <p>© 2026 foodlilly</p>
        </div>
      </footer>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed pb-2 text-sm">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="font-medium tabular-nums">{valor}</span>
    </div>
  );
}

/** Barra do preço de venda dividida em custos (o resto é lucro). */
function BarraConta({
  itens,
  escura,
}: {
  itens: { rotulo: string; valor: number }[];
  escura?: boolean;
}) {
  const tons = [
    "bg-serie-1",
    "bg-serie-2",
    "bg-serie-3",
    "bg-serie-4",
    "bg-serie-5",
    "bg-sky-300",
  ];
  return (
    <div
      className={`flex h-4 overflow-hidden rounded-full ${escura ? "bg-highlight" : "bg-success/70"}`}
      aria-hidden
    >
      {itens.map((c, i) => (
        <span
          key={c.rotulo}
          className={`h-full border-r-2 ${escura ? "border-primary" : "border-card"} ${tons[i]}`}
          style={{ width: `${(c.valor / PRECO_EXEMPLO) * 100}%` }}
        />
      ))}
    </div>
  );
}

/** Ilustração do topo: uma ficha técnica do foodlilly, com selos flutuando. */
function MockupFicha() {
  const linhas = [
    { rotulo: "Ingredientes", valor: "R$ 4,80", w: "62%" },
    { rotulo: "Embalagem", valor: "R$ 0,90", w: "14%" },
    { rotulo: "Mão de obra", valor: "R$ 1,20", w: "18%" },
    { rotulo: "Gás e energia", valor: "R$ 0,30", w: "6%" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md animate-in fade-in zoom-in-95 duration-1000 [animation-delay:200ms] [animation-fill-mode:both] lg:mx-0 lg:ml-auto">
      <div className="rounded-3xl bg-card p-5 text-foreground shadow-2xl shadow-black/40 ring-1 ring-white/10 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
            <CookingPot className="size-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Ficha técnica · Produto
            </p>
            <p className="font-bold">Bolo de pote de brigadeiro</p>
          </div>
        </div>
        <ul className="mt-5 flex flex-col gap-3">
          {linhas.map((l, i) => (
            <li key={l.rotulo}>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{l.rotulo}</span>
                <span className="font-semibold tabular-nums">{l.valor}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full origin-left rounded-full bg-primary animate-[crescer-x_900ms_ease-out_both]"
                  style={{ width: l.w, animationDelay: `${600 + i * 120}ms` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            ["Custo", "R$ 8,64"],
            ["Margem", "40%"],
            ["Preço", "R$ 15,43"],
          ].map(([r, v], i) => (
            <div
              key={r}
              className={
                i === 2
                  ? "rounded-xl bg-primary p-3 text-primary-foreground"
                  : "rounded-xl bg-muted p-3"
              }
            >
              <p
                className={
                  i === 2
                    ? "text-[11px] text-primary-foreground/70"
                    : "text-[11px] text-muted-foreground"
                }
              >
                {r}
              </p>
              <p className="text-base font-bold tabular-nums">{v}</p>
            </div>
          ))}
        </div>
      </div>
      {/* selos flutuantes */}
      <div className="absolute -top-5 -right-3 flex items-center gap-2 rounded-2xl bg-card px-3 py-2 text-foreground shadow-xl ring-1 ring-foreground/10 animate-[flutuar_5s_ease-in-out_infinite] motion-reduce:animate-none sm:-right-6">
        <span className="flex size-8 items-center justify-center rounded-lg bg-success/12 text-success">
          <BadgeCheck className="size-4" />
        </span>
        <div>
          <p className="text-[10px] text-muted-foreground">Margem</p>
          <p className="text-sm font-bold text-success">Boa</p>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-3 flex items-center gap-2 rounded-2xl bg-card px-3 py-2 text-foreground shadow-xl ring-1 ring-foreground/10 animate-[flutuar_6s_ease-in-out_1s_infinite] motion-reduce:animate-none sm:-left-8">
        <span className="flex size-8 items-center justify-center rounded-lg bg-highlight-soft text-highlight-strong">
          <Bike className="size-4" />
        </span>
        <div>
          <p className="text-[10px] text-muted-foreground">No app de entrega</p>
          <p className="text-sm font-bold tabular-nums">R$ 20,57</p>
        </div>
      </div>
    </div>
  );
}
