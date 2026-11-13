import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarCheck, CreditCard, Rocket } from "lucide-react";

import { Logo, MolduraAcesso } from "@/components/acesso";
import { Skeleton } from "@/components/ui/skeleton";
import { PLANOS } from "@/config/planos";
import { googleAtivo } from "@/lib/auth";
import { obterSessao } from "@/lib/negocio-atual";
import { formatarMoeda } from "@/lib/numero-br";

import { FormCadastro } from "./form-cadastro";

export const metadata: Metadata = { title: "Criar conta · foodlilly" };

const PASSOS = [
  {
    icone: Rocket,
    titulo: "Hoje",
    texto: "Você cria a conta e usa o sistema inteiro.",
  },
  {
    icone: CalendarCheck,
    titulo: "Em 7 dias",
    texto: "O teste termina. Nada é cobrado sozinho.",
  },
  {
    icone: CreditCard,
    titulo: "Depois",
    texto: "Escolha um plano e pague por Pix para continuar.",
  },
];

export default function Page({ searchParams }: PageProps<"/cadastro">) {
  return (
    <MolduraAcesso
      painel={
        <>
          <Logo claro />
          <div className="flex flex-1 flex-col justify-center gap-6 max-md:hidden">
            <div>
              <span className="inline-flex rounded-full bg-highlight px-3 py-1 text-xs font-bold text-highlight-foreground">
                7 dias grátis
              </span>
              <h2 className="mt-3 text-4xl leading-tight font-bold tracking-tight">
                Comece a precificar do jeito certo
              </h2>
            </div>
            <ol className="flex flex-col gap-4">
              {PASSOS.map((p, i) => (
                <li
                  key={p.titulo}
                  className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-500 motion-reduce:animate-none"
                  style={{
                    animationDelay: `${200 + i * 120}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                    <p.icone className="size-4 text-highlight" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {p.titulo}
                    </span>
                    <span className="block text-sm text-primary-foreground/75">
                      {p.texto}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-primary-foreground/60">
              Planos a partir de{" "}
              {formatarMoeda(Math.min(...PLANOS.map((p) => p.preco)))}/mês. Sem
              fidelidade.
            </p>
          </div>
          <p className="text-sm text-primary-foreground/80 md:hidden">
            7 dias grátis, sem cartão de crédito.
          </p>
        </>
      }
    >
      <Suspense fallback={<Carregando />}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </MolduraAcesso>
  );
}

async function Conteudo({
  searchParams,
}: {
  searchParams: PageProps<"/cadastro">["searchParams"];
}) {
  const sp = await searchParams;
  if (await obterSessao()) redirect("/dashboard");
  const plano =
    typeof sp.plano === "string" && PLANOS.some((p) => p.chave === sp.plano)
      ? sp.plano
      : undefined;
  return <FormCadastro google={googleAtivo} plano={plano} />;
}

function Carregando() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Skeleton className="h-9 w-48" />
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-11" />
      ))}
    </div>
  );
}
