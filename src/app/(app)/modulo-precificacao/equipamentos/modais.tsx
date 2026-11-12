"use client";

import { useState, useTransition } from "react";

import { CampoModal, ModalExcluir, ModalFormulario, semErro } from "@/components/cadastro";
import { InputUnidade } from "@/components/formulario";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paraNumero, paraTexto } from "@/lib/numero-br";

import { criarEquipamento, editarEquipamento, excluirEquipamento } from "./actions";
import { LIMITES, medida, type Equipamento } from "./tipos";

/** Modal de cadastro (sem `equipamento`) ou edição (com `equipamento`). */
export function ModalEquipamento({
  equipamento,
  onFechar,
  onConcluido,
}: {
  equipamento?: Equipamento;
  onFechar: () => void;
  onConcluido: (mensagem: string) => void;
}) {
  const [nome, setNome] = useState(equipamento?.nome ?? "");
  const [gas, setGas] = useState(equipamento?.tipo === "gas");
  // Guarda os dois valores para não perder o digitado ao alternar o tipo.
  const [potencia, setPotencia] = useState(paraTexto(equipamento?.potenciaW));
  const [vazao, setVazao] = useState(paraTexto(equipamento?.vazaoKgH));
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvando, startTransition] = useTransition();

  const textoValor = gas ? vazao : potencia;

  function enviar() {
    const errosLocais: Record<string, string> = {};
    const valor = paraNumero(textoValor);
    if (!nome.trim()) errosLocais.nome = "Informe o nome do equipamento.";
    if (valor == null) errosLocais.valor = gas ? "Informe a vazão." : "Informe a potência.";
    else if (Number.isNaN(valor)) errosLocais.valor = "Informe um número válido.";
    if (Object.keys(errosLocais).length || valor == null || Number.isNaN(valor)) {
      setErros(errosLocais);
      return;
    }

    const dados = { nome: nome.trim(), tipo: gas ? ("gas" as const) : ("eletrico" as const), valor };
    startTransition(async () => {
      const resultado = equipamento
        ? await editarEquipamento(equipamento.id, dados)
        : await criarEquipamento(dados);
      if (resultado.ok) {
        onConcluido(equipamento ? `"${dados.nome}" foi atualizado.` : `"${dados.nome}" foi adicionado.`);
      } else {
        setErros(resultado.erros ?? {});
        setErroGeral(resultado.mensagem);
      }
    });
  }

  return (
    <ModalFormulario
      editando={Boolean(equipamento)}
      item="equipamento"
      descricaoNovo="Preencha os dados abaixo para cadastrar um novo equipamento."
      salvando={salvando}
      erroGeral={erroGeral}
      onFechar={onFechar}
      onEnviar={enviar}
    >
      <CampoModal
        id="equipamento-nome"
        rotulo="Nome do equipamento"
        descricao="Como você identifica este equipamento."
        erro={erros.nome}
      >
        <Input
          id="equipamento-nome"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setErros(semErro("nome"));
          }}
          placeholder="Ex.: Forno industrial"
          maxLength={LIMITES.nome}
          autoComplete="off"
          autoFocus={!equipamento}
          aria-invalid={Boolean(erros.nome)}
          className="h-10 bg-muted/60"
        />
      </CampoModal>

      <Label
        htmlFor="equipamento-gas"
        className="flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 font-normal hover:bg-muted/50"
      >
        <Checkbox
          id="equipamento-gas"
          checked={gas}
          onCheckedChange={(marcado) => {
            setGas(marcado === true);
            setErros(semErro("valor"));
          }}
        />
        <span>
          <span className="block text-sm font-medium">É um equipamento a gás?</span>
          <span className="block text-xs text-muted-foreground">
            Marque para informar o consumo de gás em vez da potência elétrica.
          </span>
        </span>
      </Label>

      <CampoModal
        id="equipamento-valor"
        rotulo={gas ? "Vazão (kg/h)" : "Potência (watts)"}
        descricao={
          gas
            ? "Consumo de gás por hora de uso. Veja no manual ou na etiqueta do equipamento."
            : "Potência elétrica em watts (W). Veja na etiqueta ou no manual do equipamento."
        }
        erro={erros.valor}
      >
        <InputUnidade
          id="equipamento-valor"
          sufixo={gas ? "kg/h" : "W"}
          inputMode="decimal"
          value={textoValor}
          onChange={(e) => {
            (gas ? setVazao : setPotencia)(e.target.value);
            setErros(semErro("valor"));
          }}
          placeholder={gas ? "Ex.: 0,5" : "Ex.: 2000"}
          aria-invalid={Boolean(erros.valor)}
        />
      </CampoModal>
    </ModalFormulario>
  );
}

export function ModalExcluirEquipamento({
  equipamento,
  onFechar,
  onConcluido,
}: {
  equipamento: Equipamento;
  onFechar: () => void;
  onConcluido: (mensagem: string) => void;
}) {
  return (
    <ModalExcluir
      item="equipamento"
      nome={equipamento.nome}
      consequencia="Receitas e produtos que usam este equipamento deixarão de considerar o custo dele."
      detalhes={[medida(equipamento)]}
      excluir={() => excluirEquipamento(equipamento.id)}
      onFechar={onFechar}
      onConcluido={onConcluido}
    />
  );
}
