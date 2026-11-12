"use client";

import { useState } from "react";
import { CircleDollarSign, Users, Wallet } from "lucide-react";

import {
  BannerCadastro,
  CabecalhoLista,
  CardCadastro,
  GradeCadastro,
  VazioCadastro,
} from "@/components/cadastro";
import { notificar } from "@/components/notificacoes";
import { formatarMoeda } from "@/lib/numero-br";
import { compararNome, iniciais, normalizar, plural } from "@/lib/texto";

import { ModalExcluirFuncionario, ModalFuncionario } from "./modais";
import type { Funcionario } from "./tipos";

const ordens = {
  "nome-asc": "Nome (A–Z)",
  "nome-desc": "Nome (Z–A)",
  "maior-salario": "Maior salário",
  "menor-salario": "Menor salário",
  recentes: "Mais recentes",
};
type Ordem = keyof typeof ordens;

type Modal =
  | { tipo: "novo" }
  | { tipo: "editar"; funcionario: Funcionario }
  | { tipo: "excluir"; funcionario: Funcionario }
  | null;

/** Cores dos avatares (todas com contraste para as iniciais). */
const coresAvatar = [
  "bg-primary text-primary-foreground",
  "bg-highlight text-highlight-foreground",
  "bg-[#3b6a99] text-white",
  "bg-primary-soft text-primary",
];

/** Cor estável por funcionário (não muda ao reordenar). */
function corDoAvatar(id: string) {
  let soma = 0;
  for (const c of id) soma = (soma + c.charCodeAt(0)) % 997;
  return coresAvatar[soma % coresAvatar.length];
}

function ordenar(lista: Funcionario[], ordem: Ordem) {
  const copia = [...lista];
  switch (ordem) {
    case "nome-asc":
      return copia.sort(compararNome);
    case "nome-desc":
      return copia.sort((a, b) => compararNome(b, a));
    case "maior-salario":
      return copia.sort((a, b) => b.salario - a.salario);
    case "menor-salario":
      return copia.sort((a, b) => a.salario - b.salario);
    case "recentes":
      return copia.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }
}

export function ListaFuncionarios({ funcionarios }: { funcionarios: Funcionario[] }) {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("nome-asc");
  const [modal, setModal] = useState<Modal>(null);

  const folha = funcionarios.reduce((s, f) => s + f.salario, 0);
  const media = funcionarios.length ? folha / funcionarios.length : 0;
  const termo = normalizar(busca);
  const visiveis = ordenar(
    termo ? funcionarios.filter((f) => normalizar(f.nome).includes(termo)) : funcionarios,
    ordem,
  );

  function concluir(titulo: string, descricao: string) {
    setModal(null);
    notificar.sucesso(titulo, descricao);
  }

  return (
    <>
      <BannerCadastro
        titulo="Funcionários"
        descricao="Cadastre a equipe e os salários para calcular o custo de mão de obra das receitas."
        icone={Users}
        resumo={[
          { texto: plural(funcionarios.length, "funcionário", "funcionários") },
          { texto: `${formatarMoeda(folha)} por mês`, icone: Wallet },
          { texto: `${formatarMoeda(media)} de média`, icone: CircleDollarSign },
        ]}
        busca={busca}
        onBusca={setBusca}
        placeholderBusca="Buscar funcionário..."
        ordens={ordens}
        ordem={ordem}
        onOrdem={setOrdem}
        onNovo={() => setModal({ tipo: "novo" })}
      />

      <section className="flex flex-col gap-4">
        <CabecalhoLista
          icone={Users}
          titulo="Funcionários cadastrados"
          info={termo ? `${visiveis.length} de ${funcionarios.length}` : ordens[ordem]}
        />

        {visiveis.length ? (
          <GradeCadastro>
            {visiveis.map((f) => (
              <CardCadastro
                key={f.id}
                titulo={f.nome}
                onEditar={() => setModal({ tipo: "editar", funcionario: f })}
                onExcluir={() => setModal({ tipo: "excluir", funcionario: f })}
                avatar={
                  <span
                    aria-hidden
                    className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold ${corDoAvatar(f.id)}`}
                  >
                    {iniciais(f.nome)}
                  </span>
                }
              >
                <p className="mt-1 text-sm text-muted-foreground">
                  <strong className="text-base text-foreground tabular-nums">{formatarMoeda(f.salario)}</strong>{" "}
                  /mês
                </p>
              </CardCadastro>
            ))}
          </GradeCadastro>
        ) : (
          <VazioCadastro
            icone={Users}
            busca={termo ? busca : undefined}
            textoVazio="Nenhum funcionário cadastrado."
            dicaVazia="Cadastre a equipe para incluir a mão de obra no custo das receitas."
            rotuloNovo="Novo funcionário"
            onLimpar={() => setBusca("")}
            onNovo={() => setModal({ tipo: "novo" })}
          />
        )}
      </section>

      {modal?.tipo === "novo" && <ModalFuncionario onFechar={() => setModal(null)} onConcluido={concluir} />}
      {modal?.tipo === "editar" && (
        <ModalFuncionario
          key={modal.funcionario.id}
          funcionario={modal.funcionario}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
      {modal?.tipo === "excluir" && (
        <ModalExcluirFuncionario
          funcionario={modal.funcionario}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
    </>
  );
}
