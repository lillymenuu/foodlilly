"use client";

import { useLayoutEffect, useMemo, useState, useTransition } from "react";
import {
  ChevronDown,
  FolderPlus,
  Layers,
  Lock,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash,
} from "lucide-react";
import { cn } from "cn";

import {
  CampoModal,
  ModalExcluir,
  ModalFormulario,
  semErro,
} from "@/components/cadastro";
import { ModalCabecalho } from "@/components/modal-cabecalho";
import { notificar } from "@/components/notificacoes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { compararNome, normalizar, plural } from "@/lib/texto";

import {
  adicionarSugestoes,
  criarSubcategoria,
  excluirCategoriaFinanceira,
  renomearSubcategoria,
} from "./acoes-categorias";
import {
  CATALOGO,
  GRUPOS,
  GRUPOS_FINANCEIROS,
  LIMITES_CATEGORIA,
  type GrupoFinanceiro,
} from "./catalogo-categorias";
import type { CategoriaFinanceira } from "./tipos";

type Modal =
  | { tipo: "sugestoes" }
  | { tipo: "nova"; principal: CategoriaFinanceira }
  | { tipo: "renomear"; sub: CategoriaFinanceira }
  | { tipo: "excluir"; categoria: CategoriaFinanceira; subs: number }
  | null;

const ordemCatalogo = new Map(CATALOGO.map((p, i) => [p.chave, i]));

export function PainelCategorias({
  categorias,
}: {
  categorias: CategoriaFinanceira[];
}) {
  const [modal, setModal] = useState<Modal>(null);
  // Ao esconder a página (navegação com Cache Components), fecha os modais.
  useLayoutEffect(() => () => setModal(null), []);
  const [grupo, setGrupo] = useState<GrupoFinanceiro>("recebimentos");
  const [fechadas, setFechadas] = useState<Set<string>>(new Set());
  const info = GRUPOS[grupo];

  const porGrupo = useMemo(() => {
    const m = new Map<GrupoFinanceiro, number>();
    for (const c of categorias) m.set(c.grupo, (m.get(c.grupo) ?? 0) + 1);
    return m;
  }, [categorias]);
  const principais = categorias
    .filter((c) => c.grupo === grupo && !c.paiId)
    .sort(
      (a, b) =>
        (ordemCatalogo.get(a.chave ?? "") ?? 99) -
        (ordemCatalogo.get(b.chave ?? "") ?? 99),
    );
  const subsDe = (id: string) =>
    categorias.filter((c) => c.paiId === id).sort(compararNome);

  const concluir = (titulo: string, descricao: string) => {
    setModal(null);
    notificar.sucesso(titulo, descricao);
  };

  return (
    <section className="flex flex-col gap-4">
      {/* Grupos */}
      <div
        role="tablist"
        aria-label="Grupos de categorias"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {GRUPOS_FINANCEIROS.map((g) => {
          const G = GRUPOS[g];
          const ativo = g === grupo;
          return (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setGrupo(g)}
              className={cn(
                "flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold ring-1 transition-[background-color,box-shadow,color] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                ativo
                  ? "text-white shadow-md ring-transparent"
                  : "bg-card text-foreground ring-foreground/10 hover:ring-foreground/25",
              )}
              style={ativo ? { background: G.cor } : undefined}
            >
              <G.icone
                className="size-4"
                style={ativo ? undefined : { color: G.cor }}
              />
              {G.rotulo}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  ativo ? "bg-white/25" : "bg-muted text-muted-foreground",
                )}
              >
                {porGrupo.get(g) ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grupo atual + aviso das principais fixas */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: info.cor }}
          >
            <info.icone className="size-5" />
          </span>
          <div>
            <h3 className="font-semibold">{info.rotulo}</h3>
            <p className="text-sm text-muted-foreground">{info.descricao}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl bg-primary-soft/60 p-4 sm:flex-row sm:items-center">
          <Lock className="hidden size-5 shrink-0 text-primary sm:block" />
          <div className="flex-1">
            <p className="text-sm font-semibold">
              As categorias principais são fixas
            </p>
            <p className="text-xs text-muted-foreground">
              Elas alimentam o CMV e o DRE. Crie quantas subcategorias quiser
              dentro de cada uma: é nelas que os gastos e recebimentos são
              lançados.
            </p>
          </div>
          <Button
            variant="highlight"
            className="h-10 shrink-0"
            onClick={() => setModal({ tipo: "sugestoes" })}
          >
            <Sparkles data-icon="inline-start" />
            Sugestões
          </Button>
        </div>
      </div>

      {/* Lista */}
      {principais.length ? (
        <ul className="flex flex-col gap-3">
          {principais.map((p, i) => {
            const subs = subsDe(p.id);
            const aberta = !fechadas.has(p.id);
            return (
              <li
                key={p.id}
                className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
                style={{
                  animationDelay: `${i * 50}ms`,
                  animationFillMode: "both",
                }}
              >
                <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFechadas((f) => {
                        const n = new Set(f);
                        if (n.has(p.id)) n.delete(p.id);
                        else n.add(p.id);
                        return n;
                      })
                    }
                    aria-expanded={aberta}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        !aberta && "-rotate-90",
                      )}
                    />
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: info.cor }}
                    />
                    <span className="truncate font-semibold">{p.nome}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      ({plural(subs.length, "subcategoria", "subcategorias")})
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setModal({ tipo: "nova", principal: p })}
                    aria-label={`Nova subcategoria em ${p.nome}`}
                    title="Nova subcategoria"
                    className="text-success hover:text-success"
                  >
                    <FolderPlus />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setModal({
                        tipo: "excluir",
                        categoria: p,
                        subs: subs.length,
                      })
                    }
                    aria-label={`Excluir ${p.nome}`}
                    title="Excluir categoria"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash />
                  </Button>
                </div>
                {aberta && (
                  <ul
                    className="ml-6 border-l-2 pb-2 sm:ml-8"
                    style={{
                      borderColor: `color-mix(in oklab, ${info.cor} 35%, transparent)`,
                    }}
                  >
                    {subs.map((s) => (
                      <li
                        key={s.id}
                        className="group flex items-center gap-2 py-1 pr-3 pl-4 hover:bg-muted/50 sm:pr-4"
                      >
                        <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {s.nome}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setModal({ tipo: "renomear", sub: s })}
                          aria-label={`Renomear ${s.nome}`}
                          title="Renomear"
                          className="text-muted-foreground"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            setModal({ tipo: "excluir", categoria: s, subs: 0 })
                          }
                          aria-label={`Excluir ${s.nome}`}
                          title="Excluir"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash />
                        </Button>
                      </li>
                    ))}
                    {!subs.length && (
                      <li className="py-2 pl-4 text-sm text-muted-foreground">
                        Nenhuma subcategoria. Use o botão de pasta para criar.
                      </li>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-5 py-12 text-center ring-1 ring-foreground/10">
          <span
            className="flex size-12 items-center justify-center rounded-2xl text-white"
            style={{ background: info.cor }}
          >
            <Layers className="size-6" />
          </span>
          <p className="font-medium">
            Nenhuma categoria em {info.rotulo.toLowerCase()} ainda
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Use as Sugestões para adicionar as categorias principais e as
            subcategorias mais comuns.
          </p>
          <Button
            variant="highlight"
            onClick={() => setModal({ tipo: "sugestoes" })}
          >
            <Sparkles data-icon="inline-start" />
            Ver sugestões
          </Button>
        </div>
      )}
      <p className="text-right text-sm text-muted-foreground">
        Total no grupo:{" "}
        {plural(porGrupo.get(grupo) ?? 0, "categoria", "categorias")}
      </p>

      {modal?.tipo === "sugestoes" && (
        <ModalSugestoes
          grupo={grupo}
          categorias={categorias}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
      {modal?.tipo === "nova" && (
        <ModalSubcategoria
          principal={modal.principal}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
      {modal?.tipo === "renomear" && (
        <ModalSubcategoria
          sub={modal.sub}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
      {modal?.tipo === "excluir" && (
        <ModalExcluir
          item={modal.categoria.paiId ? "subcategoria" : "categoria"}
          genero="f"
          nome={modal.categoria.nome}
          consequencia={
            modal.categoria.paiId
              ? "A subcategoria será removida."
              : modal.subs
                ? `As ${plural(modal.subs, "subcategoria", "subcategorias")} dela também serão removidas. Você pode adicioná-la de novo pelas Sugestões.`
                : "Você pode adicioná-la de novo pelas Sugestões."
          }
          detalhes={[
            { rotulo: "Grupo", valor: GRUPOS[modal.categoria.grupo].rotulo },
          ]}
          excluir={() => excluirCategoriaFinanceira(modal.categoria.id)}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
    </section>
  );
}

function ModalSubcategoria({
  principal,
  sub,
  onFechar,
  onConcluido,
}: {
  principal?: CategoriaFinanceira;
  sub?: CategoriaFinanceira;
  onFechar: () => void;
  onConcluido: (t: string, d: string) => void;
}) {
  const [nome, setNome] = useState(sub?.nome ?? "");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvando, start] = useTransition();
  return (
    <ModalFormulario
      editando={Boolean(sub)}
      item="subcategoria"
      genero="f"
      subtitulo={sub ? sub.nome : undefined}
      descricaoNovo={`Dentro de ${principal?.nome}.`}
      salvando={salvando}
      erroGeral={erroGeral}
      onFechar={onFechar}
      onEnviar={() => {
        if (!nome.trim()) return setErros({ nome: "Informe o nome." });
        start(async () => {
          const r = sub
            ? await renomearSubcategoria(sub.id, nome)
            : await criarSubcategoria(principal!.id, nome);
          if (r.ok)
            onConcluido(
              sub ? "Subcategoria renomeada" : "Subcategoria criada",
              nome.trim(),
            );
          else {
            setErros(r.erros ?? {});
            setErroGeral(r.erros ? undefined : r.mensagem);
          }
        });
      }}
    >
      <CampoModal id="sub-nome" rotulo="Nome da subcategoria" erro={erros.nome}>
        <Input
          id="sub-nome"
          value={nome}
          maxLength={LIMITES_CATEGORIA.nome}
          autoFocus
          placeholder="Ex.: Vendas no balcão"
          onChange={(e) => {
            setNome(e.target.value);
            setErros(semErro("nome"));
          }}
          className="h-10 bg-muted/60"
        />
      </CampoModal>
    </ModalFormulario>
  );
}

function ModalSugestoes({
  grupo,
  categorias,
  onFechar,
  onConcluido,
}: {
  grupo: GrupoFinanceiro;
  categorias: CategoriaFinanceira[];
  onFechar: () => void;
  onConcluido: (t: string, d: string) => void;
}) {
  const info = GRUPOS[grupo];
  const [busca, setBusca] = useState("");
  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  const [principais, setPrincipais] = useState<Set<string>>(new Set());
  const [subs, setSubs] = useState<Set<string>>(new Set()); // "chave|nome"
  const [salvando, start] = useTransition();

  const existentes = useMemo(() => {
    const porChave = new Map(
      categorias.filter((c) => c.chave).map((c) => [c.chave!, c.id]),
    );
    const nomesSub = new Map<string, Set<string>>();
    for (const c of categorias)
      if (c.paiId)
        nomesSub.set(
          c.paiId,
          (nomesSub.get(c.paiId) ?? new Set()).add(normalizar(c.nome)),
        );
    return { porChave, nomesSub };
  }, [categorias]);

  const termo = normalizar(busca);
  const itens = CATALOGO.filter((p) => p.grupo === grupo)
    .map((p) => {
      const idExistente = existentes.porChave.get(p.chave);
      const jaTem =
        existentes.nomesSub.get(idExistente ?? "") ?? new Set<string>();
      const disponiveis = p.sugestoes.filter((s) => !jaTem.has(normalizar(s)));
      const visiveis =
        termo && !normalizar(p.nome).includes(termo)
          ? disponiveis.filter((s) => normalizar(s).includes(termo))
          : disponiveis;
      return { ...p, adicionada: Boolean(idExistente), disponiveis, visiveis };
    })
    .filter(
      (p) => !termo || normalizar(p.nome).includes(termo) || p.visiveis.length,
    );

  const total = principais.size + subs.size;
  const alternar = <T,>(s: Set<T>, v: T) => {
    const n = new Set(s);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    return n;
  };

  return (
    <Dialog open onOpenChange={(a) => !a && onFechar()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <ModalCabecalho
          tipo="novo"
          icone={Sparkles}
          titulo={`Sugestões de ${info.rotulo.toLowerCase()}`}
          descricao="Escolha as categorias e subcategorias para adicionar."
        />
        <div className="border-b p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="sug-busca" className="sr-only">
              Buscar categorias
            </label>
            <Input
              id="sug-busca"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar categorias..."
              className="h-10 bg-muted/60 pl-9"
            />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
          {itens.map((p) => {
            const aberta = abertas.has(p.chave) || Boolean(termo);
            const selSubs = p.disponiveis.filter((s) =>
              subs.has(`${p.chave}|${s}`),
            ).length;
            return (
              <div
                key={p.chave}
                className="overflow-hidden rounded-xl ring-1 ring-foreground/10"
              >
                <div className="flex items-center gap-2 bg-muted/40 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => setAbertas((a) => alternar(a, p.chave))}
                    aria-expanded={aberta}
                    aria-label={
                      aberta
                        ? `Recolher ${p.nome}`
                        : `Ver sugestões de ${p.nome}`
                    }
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        !aberta && "-rotate-90",
                      )}
                    />
                  </button>
                  {p.adicionada ? (
                    <span className="flex-1 text-sm font-semibold text-muted-foreground">
                      {p.nome}{" "}
                      <span className="text-xs font-medium text-success">
                        (já adicionada)
                      </span>
                    </span>
                  ) : (
                    <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={principais.has(p.chave)}
                        onChange={() =>
                          setPrincipais((s) => alternar(s, p.chave))
                        }
                        className="size-4 accent-[var(--primary)]"
                      />
                      {p.nome}
                    </label>
                  )}
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {selSubs > 0 && (
                      <span className="font-semibold text-success">
                        {selSubs} selecionada{selSubs > 1 ? "s" : ""} ·{" "}
                      </span>
                    )}
                    {plural(p.disponiveis.length, "disponível", "disponíveis")}
                  </span>
                </div>
                {aberta && (
                  <ul className="flex flex-col gap-1 p-2">
                    {p.visiveis.map((s) => {
                      const k = `${p.chave}|${s}`;
                      return (
                        <li key={s}>
                          <label
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                              subs.has(k)
                                ? "bg-success/10"
                                : "hover:bg-muted/60",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={subs.has(k)}
                              onChange={() => setSubs((x) => alternar(x, k))}
                              className="size-4 accent-[var(--primary)]"
                            />
                            {s}
                          </label>
                        </li>
                      );
                    })}
                    {!p.visiveis.length && (
                      <li className="px-2 py-1.5 text-sm text-muted-foreground">
                        Todas as sugestões já foram adicionadas.
                      </li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
          {!itens.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma sugestão encontrada.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 border-t bg-muted px-4 py-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-muted-foreground">
            {total
              ? `${plural(total, "item selecionado", "itens selecionados")}`
              : "Nenhuma categoria selecionada"}
          </p>
          <div className="flex gap-2">
            <DialogClose
              render={
                <Button
                  variant="outline"
                  className="h-10 flex-1 sm:flex-none"
                />
              }
            >
              Cancelar
            </DialogClose>
            <Button
              variant="highlight"
              className="h-10 flex-1 sm:flex-none"
              disabled={!total || salvando}
              onClick={() =>
                start(async () => {
                  const r = await adicionarSugestoes({
                    grupo,
                    principais: [...principais],
                    subcategorias: [...subs].map((k) => {
                      const [chave, nome] = k.split("|");
                      return { chave, nome };
                    }),
                  });
                  if (r.ok)
                    onConcluido(
                      "Categorias adicionadas",
                      plural(
                        r.adicionadas ?? total,
                        "categoria adicionada",
                        "categorias adicionadas",
                      ),
                    );
                  else notificar.erro("Não foi possível adicionar", r.mensagem);
                })
              }
            >
              <Plus data-icon="inline-start" />
              {salvando
                ? "Adicionando..."
                : `Adicionar${total ? ` (${total})` : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
