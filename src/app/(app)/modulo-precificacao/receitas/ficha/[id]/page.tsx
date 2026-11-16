import { Suspense } from "react";
import type { Metadata } from "next";

import { CarregandoFicha } from "../../carregando-ficha";
import { ConteudoFicha } from "../../conteudo-editor";

export const metadata: Metadata = { title: "Ficha técnica · foodlilly" };

export default function Page({
  params,
}: PageProps<"/modulo-precificacao/receitas/ficha/[id]">) {
  return (
    <Suspense fallback={<CarregandoFicha />}>
      <ConteudoFicha params={params} />
    </Suspense>
  );
}
