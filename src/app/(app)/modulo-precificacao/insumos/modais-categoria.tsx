"use client";

import { useState, useTransition } from "react";

import { CampoModal, ModalExcluir, ModalFormulario } from "@/components/cadastro";
import { SelectNativo } from "@/components/cadastro/select-nativo";
import { Input } from "@/components/ui/input";
import { plural } from "@/lib/texto";

import { criarCategoria, excluirCategoria, renomearCategoria } from "./actions";
import { LIMITES, type Categoria } from "./tipos";

/** Criar (sem `categoria`) ou renomear (com `categoria`). */
export function ModalCategoria({
  categoria,
  onFechar,
  onConcluido,
}: {
  categoria?: Categoria;
  onFechar: () => void;
  /** `criada` vem preenchida ao criar, para já selecionar a nova categoria. */
  onConcluido: (titulo: string, descricao: string, criada?: { id: string; nome: string }) => void;
}) {
  const [nome, setNome] = useState(categoria?.nome ?? "");
  const [erro, setErro] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvando, startTransition] = useTransition();

  function mostrarErro(r: { mensagem: string; erros?: Record<string, string> }) {
    if (r.erros?.nome) setErro(r.erros.nome);
    else setErroGeral(r.mensagem);
  }

  function enviar() {
    const limpo = nome.trim();
    if (!limpo) {
      setErro("Informe o nome da categoria.");
      return;
    }
    startTransition(async () => {
      if (categoria) {
        const r = await renomearCategoria(categoria.id, limpo);
        if (r.ok) onConcluido("Categoria atualizada", limpo);
        else mostrarErro(r);
      } else {
        const r = await criarCategoria(limpo);
        if (r.ok) onConcluido("Categoria criada", limpo, r.categoria);
        else mostrarErro(r);
      }
    });
  }

  return (
    <ModalFormulario
      editando={Boolean(categoria)}
      item="categoria"
      genero="f"
      subtitulo={categoria ? "Renomear atualiza todos os insumos desta categoria." : undefined}
      descricaoNovo="Crie uma categoria para organizar seus insumos."
      salvando={salvando}
      erroGeral={erroGeral}
      onFechar={onFechar}
      onEnviar={enviar}
    >
      <CampoModal id="categoria-nome" rotulo="Nome" erro={erro}>
        <Input
          id="categoria-nome"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setErro(undefined);
          }}
          placeholder="Ex.: Páscoa, Bolos festivos..."
          maxLength={LIMITES.categoria}
          autoComplete="off"
          autoFocus
          aria-invalid={Boolean(erro)}
          className="h-10 bg-muted/60"
        />
        <p className="text-right text-xs text-muted-foreground tabular-nums">
          {nome.length}/{LIMITES.categoria}
        </p>
      </CampoModal>
    </ModalFormulario>
  );
}

export function ModalExcluirCategoria({
  categoria,
  categorias,
  onFechar,
  onConcluido,
}: {
  categoria: Categoria;
  categorias: Categoria[];
  onFechar: () => void;
  onConcluido: (titulo: string, descricao: string) => void;
}) {
  const outras = categorias.filter((c) => c.id !== categoria.id);
  const padrao = outras.find((c) => c.nome === "Outros") ?? outras[0];
  const [destino, setDestino] = useState(padrao?.id ?? "");
  const temInsumos = categoria.insumos > 0;

  return (
    <ModalExcluir
      item="categoria"
      genero="f"
      nome={categoria.nome}
      consequencia={
        temInsumos
          ? "Os insumos precisam ficar em alguma categoria. Escolha o destino antes de excluir."
          : "Nenhum insumo usa esta categoria."
      }
      detalhes={[{ rotulo: "Insumos", valor: plural(categoria.insumos, "insumo", "insumos") }]}
      desabilitado={temInsumos && !destino}
      excluir={() => excluirCategoria(categoria.id, temInsumos ? destino : undefined)}
      onFechar={onFechar}
      onConcluido={onConcluido}
    >
      {temInsumos && (
        <CampoModal
          id="categoria-destino"
          rotulo="Mover insumos para"
          descricao={`${plural(categoria.insumos, "insumo será movido", "insumos serão movidos")} para a categoria escolhida.`}
        >
          <SelectNativo id="categoria-destino" value={destino} onChange={(e) => setDestino(e.target.value)}>
            {outras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </SelectNativo>
        </CampoModal>
      )}
    </ModalExcluir>
  );
}
