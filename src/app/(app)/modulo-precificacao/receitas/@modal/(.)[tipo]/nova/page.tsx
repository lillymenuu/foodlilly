import { Suspense } from "react";

import { CarregandoFicha } from "../../../carregando-ficha";
import { ConteudoNova } from "../../../conteudo-editor";
import { ModalRota } from "../../../modal-rota";

/** Cadastro novo aberto a partir da lista: modal por cima dela. */
export default function Page({
  params,
}: PageProps<"/modulo-precificacao/receitas/[tipo]/nova">) {
  return (
    <Suspense fallback={null}>
      <ModalRota titulo="Nova ficha técnica">
        <Suspense fallback={<CarregandoFicha />}>
          <ConteudoNova params={params} />
        </Suspense>
      </ModalRota>
    </Suspense>
  );
}
