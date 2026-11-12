"use client";

import { useState } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "cn";

import { CampoModal, ModalFormulario } from "@/components/cadastro";
import { InputUnidade } from "@/components/formulario";
import { normalizar } from "@/lib/texto";
import { paraNumero, paraTexto } from "@/lib/numero-br";

import type { TipoItem } from "./calculo";

export type OpcaoItem = { id: string; nome: string; detalhe?: string; grupo: string; unidade: string; aviso?: string };

export const ROTULO_ITEM: Record<TipoItem, { singular: string; genero: "m" | "f"; quantidade: string }> = {
  ingrediente: { singular: "ingrediente", genero: "m", quantidade: "Quantidade" },
  embalagem: { singular: "embalagem", genero: "f", quantidade: "Quantidade" },
  receita: { singular: "receita", genero: "f", quantidade: "Quantidade (gramas)" },
  produto: { singular: "produto", genero: "m", quantidade: "Quantidade (gramas)" },
  mao_obra: { singular: "mão de obra", genero: "f", quantidade: "Tempo de trabalho (minutos)" },
  equipamento: { singular: "equipamento", genero: "m", quantidade: "Tempo de uso (minutos)" },
};

/** Adicionar (sem `atual`) ou alterar a quantidade (com `atual`) de um item da composição. */
export function ModalItem({
  tipo,
  opcoes,
  atual,
  onFechar,
  onConfirmar,
}: {
  tipo: TipoItem;
  opcoes: OpcaoItem[];
  atual?: { refId: string; quantidade: number };
  onFechar: () => void;
  onConfirmar: (refId: string, quantidade: number) => void;
}) {
  const r = ROTULO_ITEM[tipo];
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(atual?.refId ?? "");
  const [quantidade, setQuantidade] = useState(atual ? paraTexto(atual.quantidade) : "");
  const [erros, setErros] = useState<Record<string, string>>({});

  const termo = normalizar(busca);
  const filtradas = termo ? opcoes.filter((o) => normalizar(`${o.nome} ${o.grupo}`).includes(termo)) : opcoes;
  const grupos = [...new Set(filtradas.map((o) => o.grupo))];
  const escolhida = opcoes.find((o) => o.id === selecionado);

  function enviar() {
    const e: Record<string, string> = {};
    const n = paraNumero(quantidade);
    if (!selecionado) e.item = `Escolha ${r.genero === "f" ? "uma" : "um"} ${r.singular}.`;
    if (n == null || Number.isNaN(n) || n <= 0) e.quantidade = "Informe uma quantidade maior que zero.";
    if (Object.keys(e).length || !n) {
      setErros(e);
      return;
    }
    onConfirmar(selecionado, n);
  }

  return (
    <ModalFormulario
      editando={Boolean(atual)}
      item={r.singular}
      genero={r.genero}
      subtitulo={atual ? escolhida?.nome : undefined}
      descricaoNovo={
        tipo === "mao_obra" || tipo === "equipamento"
          ? "Selecione e informe o tempo."
          : "Selecione e informe a quantidade usada."
      }
      salvando={false}
      onFechar={onFechar}
      onEnviar={enviar}
    >
      {!atual && (
        <div className="flex flex-col gap-2">
          <label className="relative">
            <span className="sr-only">Buscar</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar..."
              autoFocus
              className="h-10 w-full rounded-lg border border-input bg-muted/60 pr-3 pl-9 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            />
          </label>
          <div
            role="listbox"
            aria-label={`Escolha ${r.genero === "f" ? "a" : "o"} ${r.singular}`}
            className={cn("max-h-56 overflow-y-auto rounded-xl border p-1.5", erros.item && "border-destructive/60")}
          >
            {grupos.length ? (
              grupos.map((g) => (
                <div key={g}>
                  <p className="px-2 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{g}</p>
                  {filtradas
                    .filter((o) => o.grupo === g)
                    .map((o) => {
                      const ativo = o.id === selecionado;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          role="option"
                          aria-selected={ativo}
                          onClick={() => {
                            setSelecionado(o.id);
                            setErros((x) => ({ ...x, item: "" }));
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                            ativo && "bg-primary-soft font-medium text-primary hover:bg-primary-soft",
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{o.nome}</span>
                            {(o.detalhe || o.aviso) && (
                              <span className={cn("block truncate text-xs", o.aviso ? "text-amber-700" : "text-muted-foreground")}>
                                {o.aviso ?? o.detalhe}
                              </span>
                            )}
                          </span>
                          {ativo && <Check className="size-4 shrink-0" />}
                        </button>
                      );
                    })}
                </div>
              ))
            ) : (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {opcoes.length ? "Nada encontrado." : "Nenhuma opção cadastrada ainda."}
              </p>
            )}
          </div>
          {erros.item && <p className="text-xs text-destructive">{erros.item}</p>}
        </div>
      )}

      <CampoModal
        id="item-quantidade"
        rotulo={r.quantidade}
        descricao={escolhida && (tipo === "ingrediente" || tipo === "embalagem") ? `Na unidade do insumo: ${escolhida.unidade}.` : undefined}
        erro={erros.quantidade}
      >
        <InputUnidade
          id="item-quantidade"
          inputMode="decimal"
          sufixo={escolhida?.unidade ?? (tipo === "mao_obra" || tipo === "equipamento" ? "min" : tipo === "receita" || tipo === "produto" ? "g" : undefined)}
          value={quantidade}
          onChange={(e) => {
            setQuantidade(e.target.value);
            setErros((x) => ({ ...x, quantidade: "" }));
          }}
          placeholder={tipo === "mao_obra" || tipo === "equipamento" ? "Ex.: 30" : "Ex.: 200"}
          autoFocus={Boolean(atual)}
          aria-invalid={Boolean(erros.quantidade)}
        />
      </CampoModal>
    </ModalFormulario>
  );
}
