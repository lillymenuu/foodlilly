"use client";

import { useState, useTransition } from "react";

import { CampoModal, ModalExcluir, ModalFormulario, semErro } from "@/components/cadastro";
import { InputUnidade } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { formatarMoeda, mascaraMoeda, paraNumero, paraTexto } from "@/lib/numero-br";

import { criarFuncionario, editarFuncionario, excluirFuncionario } from "./actions";
import { LIMITES, type Funcionario } from "./tipos";

/** Modal de cadastro (sem `funcionario`) ou edição (com `funcionario`). */
export function ModalFuncionario({
  funcionario,
  onFechar,
  onConcluido,
}: {
  funcionario?: Funcionario;
  onFechar: () => void;
  onConcluido: (titulo: string, descricao: string) => void;
}) {
  const [nome, setNome] = useState(funcionario?.nome ?? "");
  const [salario, setSalario] = useState(paraTexto(funcionario?.salario, 2));
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvando, startTransition] = useTransition();

  function enviar() {
    const errosLocais: Record<string, string> = {};
    const valor = paraNumero(salario);
    if (!nome.trim()) errosLocais.nome = "Informe o nome ou a função.";
    if (!valor) errosLocais.salario = "Informe o salário.";
    if (Object.keys(errosLocais).length || !valor) {
      setErros(errosLocais);
      return;
    }

    const dados = { nome: nome.trim(), salario: valor };
    startTransition(async () => {
      const resultado = funcionario
        ? await editarFuncionario(funcionario.id, dados)
        : await criarFuncionario(dados);
      if (resultado.ok) {
        onConcluido(funcionario ? "Funcionário atualizado" : "Funcionário adicionado", dados.nome);
      } else {
        setErros(resultado.erros ?? {});
        setErroGeral(resultado.mensagem);
      }
    });
  }

  return (
    <ModalFormulario
      editando={Boolean(funcionario)}
      item="funcionário"
      descricaoNovo="Preencha os dados abaixo para cadastrar um novo funcionário."
      salvando={salvando}
      erroGeral={erroGeral}
      onFechar={onFechar}
      onEnviar={enviar}
    >
      <CampoModal
        id="funcionario-nome"
        rotulo="Nome do funcionário"
        descricao="Nome ou função (ex.: Confeiteira)."
        erro={erros.nome}
      >
        <Input
          id="funcionario-nome"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setErros(semErro("nome"));
          }}
          placeholder="Ex.: Confeiteira"
          maxLength={LIMITES.nome}
          autoComplete="off"
          autoFocus={!funcionario}
          aria-invalid={Boolean(erros.nome)}
          className="h-10 bg-muted/60"
        />
      </CampoModal>

      <CampoModal
        id="funcionario-salario"
        rotulo="Salário (R$)"
        descricao="Salário bruto mensal, sem encargos trabalhistas."
        erro={erros.salario}
      >
        <InputUnidade
          id="funcionario-salario"
          prefixo="R$"
          inputMode="numeric"
          value={salario}
          onChange={(e) => {
            setSalario(mascaraMoeda(e.target.value));
            setErros(semErro("salario"));
          }}
          placeholder="0,00"
          aria-invalid={Boolean(erros.salario)}
        />
      </CampoModal>
    </ModalFormulario>
  );
}

export function ModalExcluirFuncionario({
  funcionario,
  onFechar,
  onConcluido,
}: {
  funcionario: Funcionario;
  onFechar: () => void;
  onConcluido: (titulo: string, descricao: string) => void;
}) {
  return (
    <ModalExcluir
      item="funcionário"
      nome={funcionario.nome}
      consequencia="Esta ação é irreversível e pode afetar os cálculos de custo de mão de obra."
      detalhes={[{ rotulo: "Salário", valor: `${formatarMoeda(funcionario.salario)}/mês` }]}
      excluir={() => excluirFuncionario(funcionario.id)}
      onFechar={onFechar}
      onConcluido={onConcluido}
    />
  );
}
