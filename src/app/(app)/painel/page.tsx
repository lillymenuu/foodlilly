import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Carrot,
  CookingPot,
  Percent,
  TriangleAlert,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Painel · foodlilly" };

// DADOS DE EXEMPLO: só para visualizar o layout e a paleta.
// Serão substituídos por consultas ao banco depois do escopo aprovado.
const receitas = [
  { nome: "Bolo de pote de ninho", custo: 6.8, preco: 14, margem: 0.51 },
  { nome: "Coxinha de frango (un.)", custo: 2.35, preco: 7, margem: 0.66 },
  { nome: "Marmita executiva", custo: 15.9, preco: 24, margem: 0.34 },
  { nome: "Brigadeiro gourmet (un.)", custo: 1.45, preco: 4.5, margem: 0.68 },
  { nome: "Torta de limão (fatia)", custo: 5.2, preco: 9, margem: 0.42 },
];

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });

const MARGEM_MINIMA = 0.4;

export default function PainelPage() {
  const margemMedia = receitas.reduce((s, r) => s + r.margem, 0) / receitas.length;
  const abaixo = receitas.filter((r) => r.margem < MARGEM_MINIMA).length;

  return (
    <>
      <PageHeader
        title="Painel"
        description="Visão geral dos custos e preços do seu negócio."
      >
        <Button variant="highlight" render={<Link href="/precificacao" />}>
          Calcular preço
          <ArrowRight data-icon="inline-end" />
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-primary text-primary-foreground ring-0">
          <CardHeader>
            <CardDescription className="text-primary-foreground/75">
              Margem média
            </CardDescription>
            <CardAction>
              <Percent className="size-5 text-highlight" />
            </CardAction>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              {pct.format(margemMedia)}
            </CardTitle>
          </CardHeader>
        </Card>

        <ResumoCard titulo="Receitas" valor="5" icone={CookingPot} />
        <ResumoCard titulo="Insumos" valor="38" icone={Carrot} />
        <ResumoCard
          titulo="Abaixo da margem mínima"
          valor={String(abaixo)}
          icone={TriangleAlert}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Receitas</CardTitle>
            <CardDescription>Custo, preço de venda e margem de cada item.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Receita</th>
                  <th className="pb-2 text-right font-medium">Custo</th>
                  <th className="pb-2 text-right font-medium">Preço</th>
                  <th className="pb-2 text-right font-medium">Margem</th>
                </tr>
              </thead>
              <tbody>
                {receitas.map((r) => (
                  <tr key={r.nome} className="border-b last:border-0">
                    <td className="py-3 font-medium">{r.nome}</td>
                    <td className="py-3 text-right tabular-nums">{brl.format(r.custo)}</td>
                    <td className="py-3 text-right tabular-nums">{brl.format(r.preco)}</td>
                    <td className="py-3 text-right">
                      <Badge
                        variant={r.margem < MARGEM_MINIMA ? "destructive" : "secondary"}
                        className="tabular-nums"
                      >
                        {pct.format(r.margem)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sua assinatura</CardTitle>
            <CardDescription>Plano mensal</CardDescription>
            <CardAction>
              <CalendarClock className="size-5 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="rounded-lg bg-highlight-soft p-4">
              <p className="text-sm text-highlight-foreground/80">Vence em</p>
              <p className="text-2xl font-semibold text-highlight-foreground">12 dias</p>
              <p className="text-sm text-highlight-foreground/80">23/11/2026</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Perto do vencimento, geramos uma nova cobrança Pix e avisamos você.
            </p>
            <Button
              variant="outline"
              className="mt-auto"
              render={<Link href="/assinatura" />}
            >
              Ver assinatura
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ResumoCard({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: string;
  icone: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardAction>
          <Icone className="size-5 text-highlight-strong" />
        </CardAction>
        <CardTitle className="text-3xl font-semibold tabular-nums">{valor}</CardTitle>
      </CardHeader>
    </Card>
  );
}
