"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bike, CreditCard, Menu, Store, X } from "lucide-react";
import { cn } from "cn";

import { Logo } from "@/components/acesso";
import { Button } from "@/components/ui/button";
import { useContagem } from "@/components/numero-animado";

const LINKS = [
  { href: "#como-funciona", rotulo: "Como funciona" },
  { href: "#recursos", rotulo: "Recursos" },
  { href: "#planos", rotulo: "Planos" },
  { href: "#duvidas", rotulo: "Dúvidas" },
];

/** Cabeçalho fixo: fica sólido ao rolar; no celular, menu em gaveta. */
export function CabecalhoLanding() {
  const [rolou, setRolou] = useState(false);
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 12);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <div
        className={cn(
          "mx-auto flex h-16 max-w-6xl items-center gap-4 rounded-2xl px-4 transition-[background-color,box-shadow,backdrop-filter] duration-300 sm:px-5",
          rolou || aberto
            ? "bg-primary-strong/90 shadow-xl shadow-black/20 ring-1 ring-white/10 backdrop-blur-md"
            : "bg-transparent",
        )}
      >
        <Logo claro />
        <nav
          aria-label="Seções"
          className="mx-auto hidden items-center gap-1 md:flex"
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {l.rotulo}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/entrar"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 sm:block"
          >
            Entrar
          </Link>
          <Button
            variant="highlight"
            render={<Link href="/cadastro" />}
            className="h-10 shadow-lg shadow-highlight/25"
          >
            <span className="sm:hidden">Teste grátis</span>
            <span className="max-sm:hidden">Testar 7 dias grátis</span>
          </Button>
          <button
            type="button"
            onClick={() => setAberto((a) => !a)}
            className="rounded-lg p-2 text-white hover:bg-white/10 md:hidden"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={aberto}
          >
            {aberto ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {aberto && (
        <nav
          aria-label="Seções"
          className="mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-2xl bg-primary-strong/95 p-3 shadow-xl ring-1 ring-white/10 backdrop-blur-md animate-in fade-in slide-in-from-top-2 md:hidden"
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setAberto(false)}
              className="rounded-xl px-4 py-3 text-white/90 hover:bg-white/10"
            >
              {l.rotulo}
            </a>
          ))}
          <Link
            href="/entrar"
            className="rounded-xl px-4 py-3 font-medium text-highlight hover:bg-white/10"
          >
            Entrar
          </Link>
        </nav>
      )}
    </header>
  );
}

/** Mostra o conteúdo com uma leve subida quando entra na tela (uma vez). */
export function Revelar({
  children,
  className,
  atraso = 0,
}: {
  children: React.ReactNode;
  className?: string;
  atraso?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisivel(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,translate] duration-700 ease-out motion-reduce:transition-none",
        visivel
          ? "translate-y-0 opacity-100"
          : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
        className,
      )}
      style={{ transitionDelay: `${atraso}ms` }}
    >
      {children}
    </div>
  );
}

const reais = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Exemplo ilustrativo: custo do bolo de pote e taxas típicas. */
const EXEMPLO = { fabricacao: 8.64, imposto: 0.04 };
const CANAIS = [
  { chave: "balcao", rotulo: "Balcão ou Pix", icone: Store, taxa: 0, app: 0 },
  {
    chave: "maquininha",
    rotulo: "Maquininha",
    icone: CreditCard,
    taxa: 0.035,
    app: 0,
  },
  {
    chave: "app",
    rotulo: "App de entrega",
    icone: Bike,
    taxa: 0.035,
    app: 0.2,
  },
] as const;

/** Simulador do passo 3: escolha a margem e o canal e veja o preço (números ilustrativos). */
export function SimuladorPreco() {
  const [margem, setMargem] = useState(0.3);
  const [canal, setCanal] =
    useState<(typeof CANAIS)[number]["chave"]>("balcao");
  const c = CANAIS.find((x) => x.chave === canal)!;
  const base = EXEMPLO.fabricacao / (1 - margem - EXEMPLO.imposto - c.taxa);
  const preco = c.app ? base / (1 - c.app) : base;
  const lucro = base * margem;
  const precoAnimado = useContagem(preco, 500);
  const lucroAnimado = useContagem(lucro, 500);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Quanto quer lucrar
        </p>
        <div
          role="radiogroup"
          aria-label="Margem de lucro"
          className="grid grid-cols-4 gap-1.5"
        >
          {[0.2, 0.3, 0.4, 0.5].map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={margem === m}
              onClick={() => setMargem(m)}
              className={cn(
                "rounded-lg py-2 text-sm font-semibold transition-colors",
                margem === m
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {m * 100}%
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Onde vende
        </p>
        <div
          role="radiogroup"
          aria-label="Canal de venda"
          className="grid gap-1.5 sm:grid-cols-3"
        >
          {CANAIS.map((x) => (
            <button
              key={x.chave}
              type="button"
              role="radio"
              aria-checked={canal === x.chave}
              onClick={() => setCanal(x.chave)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors",
                canal === x.chave
                  ? "bg-highlight text-highlight-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <x.icone className="size-3.5" />
              {x.rotulo}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-primary p-4 text-primary-foreground">
        <div>
          <p className="text-xs text-primary-foreground/70">Preço sugerido</p>
          <p className="text-2xl font-bold tabular-nums">
            {reais(precoAnimado)}
          </p>
        </div>
        <div>
          <p className="text-xs text-primary-foreground/70">
            Lucro por unidade
          </p>
          <p className="text-2xl font-bold text-highlight tabular-nums">
            {reais(lucroAnimado)}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Exemplo: bolo de pote com custo de {reais(EXEMPLO.fabricacao)}, imposto
        de 4%, maquininha de 3,5% e app com taxa de 20%.
      </p>
    </div>
  );
}

export function LinkCadastro({
  plano,
  children,
  className,
}: {
  plano?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      variant="highlight"
      size="lg"
      render={<Link href={plano ? `/cadastro?plano=${plano}` : "/cadastro"} />}
      className={cn(
        "group h-12 px-6 text-base shadow-xl shadow-highlight/25",
        className,
      )}
    >
      {children}
      <ArrowRight
        data-icon="inline-end"
        className="transition-transform group-hover:translate-x-0.5"
      />
    </Button>
  );
}
