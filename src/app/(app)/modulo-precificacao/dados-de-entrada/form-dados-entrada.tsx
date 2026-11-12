"use client";

import { useState, useTransition } from "react";
import { Settings2 } from "lucide-react";

import {
  Aviso,
  BannerFormulario,
  BarraSalvarCelular,
  CampoNumero,
  CardGrupo,
  ModalSalvo,
} from "@/components/formulario";
import { useCamposNumericos, valoresIguais } from "@/components/formulario/use-campos-numericos";

import { salvarDadosEntrada } from "./actions";
import { campos, grupos, type Valores } from "./campos";

const FORM_ID = "form-dados-entrada";

export function FormDadosEntrada({ inicial, jaSalvo }: { inicial: Valores; jaSalvo: boolean }) {
  const form = useCamposNumericos(campos, inicial);
  const [salvos, setSalvos] = useState<Valores | null>(jaSalvo ? inicial : null);
  const [erroGeral, setErroGeral] = useState<string>();
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, startTransition] = useTransition();

  const alterado = !salvos || !valoresIguais(form.numeros, salvos);
  const completos = campos.filter((c) => form.preenchido(c.chave)).length;

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (salvando) return;
    const valores = form.coletar();
    if (!valores) {
      setErroGeral("Confira os campos destacados.");
      return;
    }
    startTransition(async () => {
      const resultado = await salvarDadosEntrada(valores);
      if (resultado.ok) {
        setSalvos(valores);
        form.setErros({});
        setErroGeral(undefined);
        setModalAberto(true);
      } else {
        form.setErros(resultado.erros ?? {});
        setErroGeral(resultado.mensagem);
      }
    });
  }

  return (
    <form id={FORM_ID} onSubmit={salvar} noValidate className="contents">
      <BannerFormulario
        titulo="Dados de entrada"
        descricao="Parâmetros usados no cálculo de custos e preços. Ajuste quando quiser e salve."
        icone={Settings2}
        completos={completos}
        total={campos.length}
        formId={FORM_ID}
        alterado={alterado}
        salvando={salvando}
      />

      {(erroGeral || alterado) && (
        <Aviso tipo={erroGeral ? "erro" : "info"}>
          {erroGeral ??
            (!salvos
              ? "Estes são valores sugeridos. Revise e clique em Salvar para usá-los nos cálculos."
              : "Você tem alterações não salvas.")}
        </Aviso>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {grupos.map((grupo) => (
          <CardGrupo
            key={grupo.titulo}
            titulo={grupo.titulo}
            icone={grupo.icone}
            total={grupo.campos.length}
            completos={grupo.campos.filter((c) => form.preenchido(c.chave)).length}
          >
            <div className="flex flex-col gap-3">
              {grupo.campos.map((campo) => (
                <CampoNumero
                  key={campo.chave}
                  campo={campo}
                  valor={form.textos[campo.chave]}
                  erro={form.erros[campo.chave]}
                  onAlterar={form.alterar}
                  onFormatar={form.formatar}
                />
              ))}
            </div>
          </CardGrupo>
        ))}
      </div>

      <BarraSalvarCelular formId={FORM_ID} alterado={alterado} salvando={salvando} />
      <ModalSalvo
        aberto={modalAberto}
        onAbertoChange={setModalAberto}
        voltarHref="/modulo-precificacao"
        voltarRotulo="Precificar"
      />
    </form>
  );
}
