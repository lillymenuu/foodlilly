import { Suspense } from "react";

import { CarregandoFicha } from "../../../carregando-ficha";
import { ConteudoFicha } from "../../../conteudo-editor";
import { ModalRota } from "../../../modal-rota";

/** Ficha técnica aberta a partir da lista: modal por cima dela. */
export default function Page({
  params,
}: PageProps<"/modulo-precificacao/receitas/ficha/[id]">) {
  return (
    <Suspense fallback={null}>
      <ModalRota titulo="Ficha técnica">
        <Suspense fallback={<CarregandoFicha />}>
          <ConteudoFicha params={params} />
        </Suspense>
      </ModalRota>
    </Suspense>
  );
}
