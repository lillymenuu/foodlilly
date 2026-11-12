"use client";

import { useState, useTransition } from "react";

import { CampoModal, ModalExcluir, ModalFormulario } from "@/components/cadastro";
import { Input } from "@/components/ui/input";
import { plural } from "@/lib/texto";

import { criarCategoriaFicha, excluirCategoriaFicha, renomearCategoriaFicha } from "./actions";
import type { TipoFicha } from "./calculo";
import { INFO_TIPO, LIMITES, type CategoriaFicha } from "./tipos";

/** Criar (sem `categoria`) ou renomear (com `categoria`) uma categoria de massas, recheios ou produtos. */
export function ModalCategoriaFicha({
  tipo,
  categoria,
  onFechar,
  onConcluido,
}: {
  tipo: TipoFicha;
  categoria?: CategoriaFicha;
  onFechar: () => void;
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
        const r = await renomearCategoriaFicha(categoria.id, limpo);
        if (r.ok) onConcluido("Categoria atualizada", limpo);
        else mostrarErro(r);
      } else {
        const r = await criarCategoriaFicha(tipo, limpo);
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
      descricaoNovo={`Crie uma categoria para organizar ${INFO_TIPO[tipo].plural === "massas" ? "suas massas" : `seus ${INFO_TIPO[tipo].plural}`}.`}
      salvando={salvando}
      erroGeral={erroGeral}
      onFechar={onFechar}
      onEnviar={enviar}
    >
      <CampoModal id="categoria-ficha-nome" rotulo="Nome" erro={erro}>
        <Input
          id="categoria-ficha-nome"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setErro(undefined);
          }}
          placeholder="Ex.: Bolos, Páscoa, Salgados..."
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

export function ModalExcluirCategoriaFicha({
  tipo,
  categoria,
  onFechar,
  onConcluido,
}: {
  tipo: TipoFicha;
  categoria: CategoriaFicha;
  onFechar: () => void;
  onConcluido: (titulo: string, descricao: string) => void;
}) {
  const info = INFO_TIPO[tipo];
  return (
    <ModalExcluir
      item="categoria"
      genero="f"
      nome={categoria.nome}
      consequencia={
        categoria.fichas
          ? `${plural(categoria.fichas, info.singular, info.plural)} desta categoria ${categoria.fichas === 1 ? "ficará" : "ficarão"} sem categoria (nada é apagado).`
          : `Nenhum${info.singular === "massa" ? "a" : ""} ${info.singular} usa esta categoria.`
      }
      detalhes={[{ rotulo: info.titulo, valor: String(categoria.fichas) }]}
      excluir={() => excluirCategoriaFicha(categoria.id)}
      onFechar={onFechar}
      onConcluido={onConcluido}
    />
  );
}
