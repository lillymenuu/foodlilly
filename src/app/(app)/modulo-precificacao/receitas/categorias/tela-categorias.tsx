"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, Package, Pencil, Plus, Tag, Tags, Trash, type LucideIcon } from "lucide-react";
import { cn } from "cn";

import { BannerCadastro } from "@/components/cadastro";
import { notificar } from "@/components/notificacoes";
import { Button } from "@/components/ui/button";
import { compararNome, plural } from "@/lib/texto";

import { ModalCategoria, ModalExcluirCategoria } from "../../insumos/modais-categoria";
import type { Categoria as CategoriaInsumo } from "../../insumos/tipos";
import type { TipoFicha } from "../calculo";
import { ModalCategoriaFicha, ModalExcluirCategoriaFicha } from "../modais-categoria";
import { INFO_TIPO, type CategoriaFicha } from "../tipos";

type Aba = TipoFicha | "insumo";
const ABAS: { valor: Aba; rotulo: string; icone: LucideIcon; descricao: string }[] = [
  { valor: "massa", rotulo: "Massas", icone: INFO_TIPO.massa.icone, descricao: "Categorias das receitas de massas." },
  { valor: "recheio", rotulo: "Recheios", icone: INFO_TIPO.recheio.icone, descricao: "Categorias das receitas de recheios." },
  { valor: "produto", rotulo: "Produtos", icone: INFO_TIPO.produto.icone, descricao: "Categorias dos produtos que você vende." },
  { valor: "insumo", rotulo: "Insumos", icone: Package, descricao: "Categorias dos insumos. Renomear atualiza todos os insumos." },
];

type Linha = { id: string; nome: string; total: number; sistema: boolean };

type Modal =
  | { tipo: "nova" }
  | { tipo: "editar"; id: string }
  | { tipo: "excluir"; id: string }
  | null;

export function TelaCategorias({
  fichas,
  insumos,
}: {
  fichas: Record<TipoFicha, CategoriaFicha[]>;
  insumos: CategoriaInsumo[];
}) {
  const params = useSearchParams();
  const inicial = ABAS.find((a) => a.valor === params.get("tipo"))?.valor ?? "massa";
  const [aba, setAba] = useState<Aba>(inicial);
  const [modal, setModal] = useState<Modal>(null);

  const linhas: Linha[] = (
    aba === "insumo"
      ? insumos.map((c) => ({ id: c.id, nome: c.nome, total: c.insumos, sistema: c.sistema }))
      : fichas[aba].map((c) => ({ id: c.id, nome: c.nome, total: c.fichas, sistema: false }))
  ).sort(compararNome);
  const atual = ABAS.find((a) => a.valor === aba)!;
  const itemPlural = aba === "insumo" ? ["insumo", "insumos"] : [INFO_TIPO[aba].singular, INFO_TIPO[aba].plural];
  const totalCategorias = Object.values(fichas).reduce((s, l) => s + l.length, 0) + insumos.length;

  function concluir(titulo: string, descricao: string) {
    setModal(null);
    notificar.sucesso(titulo, descricao);
  }

  const abas = (
    <div role="tablist" aria-label="Tipo de categoria" className="flex flex-wrap gap-2">
      {ABAS.map((a) => (
        <button
          key={a.valor}
          type="button"
          role="tab"
          aria-selected={aba === a.valor}
          onClick={() => {
            setAba(a.valor);
            setModal(null);
          }}
          className={cn(
            "flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-highlight focus-visible:outline-none",
            aba === a.valor ? "bg-highlight text-highlight-foreground" : "bg-white/10 text-primary-foreground ring-1 ring-white/15 hover:bg-white/20",
          )}
        >
          <a.icone className="size-4" />
          {a.rotulo}
        </button>
      ))}
    </div>
  );

  const selecionada = modal && modal.tipo !== "nova" ? modal.id : undefined;
  const catInsumo = insumos.find((c) => c.id === selecionada);
  const catFicha = aba !== "insumo" ? fichas[aba].find((c) => c.id === selecionada) : undefined;

  return (
    <>
      <BannerCadastro
        titulo="Categorias"
        descricao="Crie e organize as categorias usadas em massas, recheios, produtos e insumos."
        icone={Tags}
        abas={abas}
        resumo={[{ texto: plural(totalCategorias, "categoria", "categorias") }]}
        semFerramentas
        busca=""
        onBusca={() => {}}
        placeholderBusca=""
        ordens={{ nome: "Nome" }}
        ordem="nome"
        onOrdem={() => {}}
        onNovo={() => {}}
      />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{atual.descricao}</p>
          <Button variant="highlight" size="lg" className="h-10 shrink-0" onClick={() => setModal({ tipo: "nova" })}>
            <Plus data-icon="inline-start" />
            Nova categoria
          </Button>
        </div>

        {linhas.length ? (
          <ul className="flex flex-col gap-2">
            {linhas.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
                <Tag className="size-4 shrink-0 text-highlight-strong" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{c.nome}</span>
                    {c.sistema && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-highlight-soft px-1.5 py-0.5 text-[11px] font-medium text-highlight-foreground">
                        <Lock className="size-3" />
                        Sistema
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">{plural(c.total, itemPlural[0], itemPlural[1])}</span>
                </span>
                {!c.sistema && (
                  <span className="flex shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setModal({ tipo: "editar", id: c.id })} aria-label={`Editar ${c.nome}`} title="Editar">
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModal({ tipo: "excluir", id: c.id })}
                      aria-label={`Excluir ${c.nome}`}
                      title="Excluir"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash />
                    </Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-card px-4 py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
            Nenhuma categoria criada ainda.
          </p>
        )}
      </section>

      {/* Massas, recheios e produtos */}
      {aba !== "insumo" && (modal?.tipo === "nova" || (modal?.tipo === "editar" && catFicha)) && (
        <ModalCategoriaFicha
          key={modal.tipo === "editar" ? modal.id : `nova-${aba}`}
          tipo={aba}
          categoria={modal.tipo === "editar" ? catFicha : undefined}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
      {aba !== "insumo" && modal?.tipo === "excluir" && catFicha && (
        <ModalExcluirCategoriaFicha
          tipo={aba}
          categoria={catFicha}
          categorias={fichas[aba]}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}

      {/* Insumos */}
      {aba === "insumo" && (modal?.tipo === "nova" || (modal?.tipo === "editar" && catInsumo)) && (
        <ModalCategoria
          key={modal.tipo === "editar" ? modal.id : "nova-insumo"}
          categoria={modal.tipo === "editar" ? catInsumo : undefined}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
      {aba === "insumo" && modal?.tipo === "excluir" && catInsumo && (
        <ModalExcluirCategoria categoria={catInsumo} categorias={insumos} onFechar={() => setModal(null)} onConcluido={concluir} />
      )}
    </>
  );
}
