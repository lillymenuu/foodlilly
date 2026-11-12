"use client";

import { useState } from "react";
import { Cog, Flame, Zap } from "lucide-react";
import { cn } from "cn";

import {
  AvisoSucesso,
  BannerCadastro,
  CabecalhoLista,
  CardCadastro,
  GradeCadastro,
  useMensagemSucesso,
  VazioCadastro,
} from "@/components/cadastro";
import { compararNome, normalizar, plural } from "@/lib/texto";

import { ModalEquipamento, ModalExcluirEquipamento } from "./modais";
import { medida, type Equipamento } from "./tipos";

const ordens = {
  tipo: "Elétricos primeiro",
  "nome-asc": "Nome (A–Z)",
  "nome-desc": "Nome (Z–A)",
  recentes: "Mais recentes",
};
type Ordem = keyof typeof ordens;

type Modal =
  | { tipo: "novo" }
  | { tipo: "editar"; equipamento: Equipamento }
  | { tipo: "excluir"; equipamento: Equipamento }
  | null;

function ordenar(lista: Equipamento[], ordem: Ordem) {
  const copia = [...lista];
  switch (ordem) {
    case "tipo":
      return copia.sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === "eletrico" ? -1 : 1));
    case "nome-asc":
      return copia.sort(compararNome);
    case "nome-desc":
      return copia.sort((a, b) => compararNome(b, a));
    case "recentes":
      return copia.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }
}

export function ListaEquipamentos({ equipamentos }: { equipamentos: Equipamento[] }) {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("tipo");
  const [modal, setModal] = useState<Modal>(null);
  const [mensagem, mostrarMensagem] = useMensagemSucesso();

  const eletricos = equipamentos.filter((e) => e.tipo === "eletrico").length;
  const termo = normalizar(busca);
  const visiveis = ordenar(
    termo ? equipamentos.filter((e) => normalizar(e.nome).includes(termo)) : equipamentos,
    ordem,
  );

  function concluir(texto: string) {
    setModal(null);
    mostrarMensagem(texto);
  }

  return (
    <>
      <BannerCadastro
        titulo="Equipamentos"
        descricao="Cadastre fornos, fogões e máquinas para calcular o custo de energia e gás das receitas."
        icone={Cog}
        resumo={[
          { texto: plural(equipamentos.length, "equipamento", "equipamentos") },
          { texto: plural(eletricos, "elétrico", "elétricos"), icone: Zap },
          { texto: `${equipamentos.length - eletricos} a gás`, icone: Flame },
        ]}
        busca={busca}
        onBusca={setBusca}
        placeholderBusca="Buscar equipamento..."
        ordens={ordens}
        ordem={ordem}
        onOrdem={setOrdem}
        onNovo={() => setModal({ tipo: "novo" })}
      />

      <AvisoSucesso mensagem={mensagem} />

      <section className="flex flex-col gap-4">
        <CabecalhoLista
          icone={Cog}
          titulo="Equipamentos cadastrados"
          info={termo ? `${visiveis.length} de ${equipamentos.length}` : ordens[ordem]}
        />

        {visiveis.length ? (
          <GradeCadastro>
            {visiveis.map((e) => {
              const eletrico = e.tipo === "eletrico";
              const Icone = eletrico ? Zap : Flame;
              const { rotulo, valor } = medida(e);
              return (
                <CardCadastro
                  key={e.id}
                  titulo={e.nome}
                  onEditar={() => setModal({ tipo: "editar", equipamento: e })}
                  onExcluir={() => setModal({ tipo: "excluir", equipamento: e })}
                  avatar={
                    <span
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-xl",
                        eletrico ? "bg-primary text-primary-foreground" : "bg-highlight text-highlight-foreground",
                      )}
                    >
                      <Icone className="size-6" />
                    </span>
                  }
                >
                  <span
                    className={cn(
                      "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      eletrico ? "bg-primary-soft text-primary" : "bg-highlight-soft text-highlight-foreground",
                    )}
                  >
                    <Icone className="size-3" />
                    {eletrico ? "Elétrico" : "Gás"}
                  </span>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {rotulo}: <strong className="text-foreground tabular-nums">{valor}</strong>
                  </p>
                </CardCadastro>
              );
            })}
          </GradeCadastro>
        ) : (
          <VazioCadastro
            icone={Cog}
            busca={termo ? busca : undefined}
            textoVazio="Nenhum equipamento cadastrado."
            dicaVazia="Cadastre os equipamentos que você usa no preparo das receitas."
            rotuloNovo="Novo equipamento"
            onLimpar={() => setBusca("")}
            onNovo={() => setModal({ tipo: "novo" })}
          />
        )}
      </section>

      {modal?.tipo === "novo" && <ModalEquipamento onFechar={() => setModal(null)} onConcluido={concluir} />}
      {modal?.tipo === "editar" && (
        <ModalEquipamento
          key={modal.equipamento.id}
          equipamento={modal.equipamento}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
      {modal?.tipo === "excluir" && (
        <ModalExcluirEquipamento
          equipamento={modal.equipamento}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
    </>
  );
}
