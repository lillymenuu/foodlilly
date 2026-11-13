import { Suspense } from "react";
import type { Metadata } from "next";
import { BadgeCheck, CalendarClock, QrCode, TriangleAlert } from "lucide-react";
import { connection } from "next/server";
import { cn } from "cn";

import { CartoesPlanos } from "@/components/cartoes-planos";
import { Skeleton } from "@/components/ui/skeleton";
import { planoPorChave } from "@/config/planos";
import { acessoDo, obterNegocioAtual } from "@/lib/negocio-atual";

export const metadata: Metadata = { title: "Assinatura · foodlilly" };

const data = (d: Date) =>
  d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection();
  const negocio = await obterNegocioAtual();
  const a = acessoDo(negocio);
  const plano = planoPorChave(negocio.plano);
  const vencido = a.situacao === "expirado";

  const status = {
    isento: {
      icone: BadgeCheck,
      titulo: "Acesso liberado",
      texto: "Sua conta tem acesso completo sem cobrança.",
    },
    pago: {
      icone: BadgeCheck,
      titulo: `${plano.nome} ativo`,
      texto: a.ate ? `Acesso garantido até ${data(a.ate)}.` : "",
    },
    teste: {
      icone: CalendarClock,
      titulo: `Teste grátis: ${a.dias === 1 ? "último dia" : `${a.dias} dias restantes`}`,
      texto: a.ate
        ? `Você pode usar tudo até ${data(a.ate)}. Depois, escolha um plano para continuar.`
        : "",
    },
    expirado: {
      icone: TriangleAlert,
      titulo: "Seu acesso venceu",
      texto:
        "Seus dados continuam guardados. Escolha um plano e pague por Pix para voltar a usar o sistema.",
    },
  }[a.situacao];

  return (
    <>
      <section
        className={cn(
          "relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5 sm:flex-row sm:items-center sm:p-7",
          vencido
            ? "bg-destructive/8 ring-1 ring-destructive/30"
            : "bg-gradient-to-br from-primary to-primary-strong text-primary-foreground",
        )}
      >
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl",
            vencido
              ? "bg-destructive/10 text-destructive"
              : "bg-highlight text-highlight-foreground",
          )}
        >
          <status.icone className="size-6" />
        </span>
        <div>
          <h1
            className={cn(
              "text-xl font-semibold tracking-tight sm:text-2xl",
              vencido && "text-destructive",
            )}
          >
            {status.titulo}
          </h1>
          <p
            className={cn(
              "mt-0.5 text-sm",
              vencido ? "text-foreground/80" : "text-primary-foreground/75",
            )}
          >
            {status.texto}
          </p>
        </div>
      </section>

      {a.situacao !== "isento" && (
        <>
          <div>
            <h2 className="text-lg font-semibold">Planos</h2>
            <p className="text-sm text-muted-foreground">
              Pagamento mensal por Pix. Sem fidelidade.
            </p>
          </div>
          <CartoesPlanos
            atual={negocio.plano}
            acao={() => ({
              rotulo: "Pagamento por Pix em breve",
              desabilitado: true,
            })}
          />
          <p className="flex items-center gap-2 rounded-xl bg-highlight-soft px-4 py-3 text-sm text-highlight-foreground">
            <QrCode className="size-4 shrink-0" />O pagamento por Pix (QR Code e
            copia e cola) está sendo preparado e aparece aqui em breve.
          </p>
        </>
      )}
    </>
  );
}
