import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CircleCheck } from "lucide-react";

import { Logo, MolduraAcesso } from "@/components/acesso";
import { destinoSeguro } from "@/lib/destino";
import { Skeleton } from "@/components/ui/skeleton";
import { googleAtivo } from "@/lib/auth";
import { obterSessao } from "@/lib/negocio-atual";

import { FormEntrar } from "./form-entrar";

export const metadata: Metadata = { title: "Entrar · foodlilly" };

export default function Page({ searchParams }: PageProps<"/entrar">) {
  return (
    <MolduraAcesso
      painel={
        <>
          <Logo claro />
          <div className="flex flex-1 flex-col justify-center gap-4 max-md:hidden">
            <h2 className="text-4xl leading-tight font-bold tracking-tight">
              Bem-vindo
              <br />
              de volta!
            </h2>
            <p className="max-w-xs text-primary-foreground/80">
              Seus preços, custos e fichas técnicas estão esperando por você.
            </p>
            <ul className="mt-2 flex flex-col gap-2 text-sm text-primary-foreground/85">
              {[
                "Custos e margens sempre atualizados",
                "Preço certo para balcão e aplicativos",
                "Funciona no celular e no computador",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CircleCheck className="size-4 text-highlight" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-primary-foreground/80 md:hidden">
            Bem-vindo de volta!
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
  searchParams: PageProps<"/entrar">["searchParams"];
}) {
  const sp = await searchParams;
  const voltar = destinoSeguro(sp.voltar);
  // Já logado: segue direto para o sistema.
  if (await obterSessao()) redirect(voltar);
  return <FormEntrar voltar={voltar} google={googleAtivo} />;
}

function Carregando() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-5">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-11" />
      <Skeleton className="h-11" />
      <Skeleton className="h-11" />
    </div>
  );
}
