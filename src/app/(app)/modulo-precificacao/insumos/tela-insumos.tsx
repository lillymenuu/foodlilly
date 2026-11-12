"use client";

import { useState } from "react";
import { Lock, Package, Pencil, Plus, Tag, Tags, Trash } from "lucide-react";
import { cn } from "cn";

import { BannerCadastro, CabecalhoLista, VazioCadastro } from "@/components/cadastro";
import { notificar } from "@/components/notificacoes";
import { Button } from "@/components/ui/button";
import { formatarMoeda, formatarMoedaPrecisa } from "@/lib/numero-br";
import { compararNome, normalizar, plural } from "@/lib/texto";

import { ModalCategoria, ModalExcluirCategoria } from "./modais-categoria";
import { ModalExcluirInsumo, ModalInsumo } from "./modais-insumo";
import { formatarVolume, valorExibicao, type Categoria, type Insumo } from "./tipos";

const ordens = {
  recentes: "Mais recentes",
  "nome-asc": "Nome (A–Z)",
  "nome-desc": "Nome (Z–A)",
  "maior-custo": "Maior custo",
  "menor-custo": "Menor custo",
  categoria: "Categoria",
};
type Ordem = keyof typeof ordens;
type Aba = "insumos" | "categorias";

type Modal =
  | { tipo: "novo-insumo" }
  | { tipo: "editar-insumo"; insumo: Insumo }
  | { tipo: "excluir-insumo"; insumo: Insumo }
  | { tipo: "nova-categoria" }
  | { tipo: "editar-categoria"; categoria: Categoria }
  | { tipo: "excluir-categoria"; categoria: Categoria }
  | null;

export function TelaInsumos({ insumos, categorias }: { insumos: Insumo[]; categorias: Categoria[] }) {
  const [aba, setAba] = useState<Aba>("insumos");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recentes");
  const [modal, setModal] = useState<Modal>(null);

  const categoriasOrdenadas = [...categorias].sort(compararNome);
  const nomeCategoria = new Map(categorias.map((c) => [c.id, c.nome]));
  const custoTotal = insumos.reduce((s, i) => s + i.custo, 0);
  const comPerda = insumos.filter((i) => i.perda > 0).length;

  const termo = normalizar(busca);
  const filtrados = termo
    ? insumos.filter((i) =>
        [i.nome, nomeCategoria.get(i.categoriaId) ?? "", i.codigoBarras ?? ""].some((t) => normalizar(t).includes(termo)),
      )
    : insumos;
  const visiveis = [...filtrados].sort((a, b) => {
    switch (ordem) {
      case "recentes":
        return b.criadoEm.localeCompare(a.criadoEm);
      case "nome-asc":
        return compararNome(a, b);
      case "nome-desc":
        return compararNome(b, a);
      case "maior-custo":
        return b.custo - a.custo;
      case "menor-custo":
        return a.custo - b.custo;
      case "categoria":
        return (nomeCategoria.get(a.categoriaId) ?? "").localeCompare(nomeCategoria.get(b.categoriaId) ?? "", "pt-BR") || compararNome(a, b);
    }
  });

  function concluir(titulo: string, descricao: string) {
    setModal(null);
    notificar.sucesso(titulo, descricao);
  }

  const abas = (
    <div role="tablist" aria-label="Seções" className="flex flex-wrap gap-2">
      {(
        [
          ["insumos", "Insumos", Package],
          ["categorias", "Categorias", Tags],
        ] as const
      ).map(([valor, rotulo, Icone]) => (
        <button
          key={valor}
          type="button"
          role="tab"
          aria-selected={aba === valor}
          onClick={() => setAba(valor)}
          className={cn(
            "flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-highlight focus-visible:outline-none",
            aba === valor
              ? "bg-highlight text-highlight-foreground"
              : "bg-white/10 text-primary-foreground ring-1 ring-white/15 hover:bg-white/20",
          )}
        >
          <Icone className="size-4" />
          {rotulo}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <BannerCadastro
        titulo="Insumos"
        descricao="Gerencie as matérias-primas, ingredientes e embalagens usados nas suas receitas e produtos."
        icone={Package}
        abas={abas}
        semFerramentas={aba === "categorias"}
        busca={busca}
        onBusca={setBusca}
        placeholderBusca="Buscar insumo, categoria ou código..."
        ordens={ordens}
        ordem={ordem}
        onOrdem={setOrdem}
        onNovo={() => setModal({ tipo: "novo-insumo" })}
      />

      {aba === "insumos" ? (
        <>
          <dl className="grid grid-cols-2 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 sm:grid-cols-4">
            {[
              { rotulo: "Total", valor: String(insumos.length), cor: "bg-primary" },
              { rotulo: "Custo total", valor: formatarMoeda(custoTotal), cor: "bg-success" },
              { rotulo: "Média", valor: formatarMoeda(insumos.length ? custoTotal / insumos.length : 0), cor: "bg-highlight-strong" },
              { rotulo: "Com perda", valor: String(comPerda), cor: "bg-destructive" },
            ].map((item, i) => (
              <div
                key={item.rotulo}
                className={cn("flex flex-col gap-1 p-4", i % 2 === 1 && "border-l", i >= 2 && "border-t sm:border-t-0", i === 2 && "sm:border-l")}
              >
                <dt className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <span className={cn("size-1.5 rounded-full", item.cor)} />
                  {item.rotulo}
                </dt>
                <dd className="text-xl font-bold tabular-nums">{item.valor}</dd>
              </div>
            ))}
          </dl>

          <section className="flex flex-col gap-4">
            <CabecalhoLista
              icone={Package}
              titulo="Insumos cadastrados"
              info={termo ? `${visiveis.length} de ${insumos.length}` : plural(insumos.length, "insumo", "insumos")}
            />
            {visiveis.length ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 min-[1100px]:grid-cols-4 xl:grid-cols-5">
                {visiveis.map((i) => (
                  <CardInsumo
                    key={i.id}
                    insumo={i}
                    categoria={nomeCategoria.get(i.categoriaId) ?? "Sem categoria"}
                    onEditar={() => setModal({ tipo: "editar-insumo", insumo: i })}
                    onExcluir={() => setModal({ tipo: "excluir-insumo", insumo: i })}
                  />
                ))}
              </ul>
            ) : (
              <VazioCadastro
                icone={Package}
                busca={termo ? busca : undefined}
                textoVazio="Nenhum insumo cadastrado ainda."
                dicaVazia="Cadastre farinhas, ovos, chocolates e embalagens com o valor que você paga. Eles serão usados no custo das receitas."
                rotuloNovo="Novo insumo"
                onLimpar={() => setBusca("")}
                onNovo={() => setModal({ tipo: "novo-insumo" })}
              />
            )}
          </section>
        </>
      ) : (
        <AbaCategorias
          categorias={categoriasOrdenadas}
          onNova={() => setModal({ tipo: "nova-categoria" })}
          onEditar={(c) => setModal({ tipo: "editar-categoria", categoria: c })}
          onExcluir={(c) => setModal({ tipo: "excluir-categoria", categoria: c })}
        />
      )}

      {(modal?.tipo === "novo-insumo" || modal?.tipo === "editar-insumo") && (
        <ModalInsumo
          key={modal.tipo === "editar-insumo" ? modal.insumo.id : "novo"}
          insumo={modal.tipo === "editar-insumo" ? modal.insumo : undefined}
          categorias={categoriasOrdenadas}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
      {modal?.tipo === "excluir-insumo" && (
        <ModalExcluirInsumo
          insumo={modal.insumo}
          categoria={nomeCategoria.get(modal.insumo.categoriaId)}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
      {(modal?.tipo === "nova-categoria" || modal?.tipo === "editar-categoria") && (
        <ModalCategoria
          key={modal.tipo === "editar-categoria" ? modal.categoria.id : "nova"}
          categoria={modal.tipo === "editar-categoria" ? modal.categoria : undefined}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
      {modal?.tipo === "excluir-categoria" && (
        <ModalExcluirCategoria
          categoria={modal.categoria}
          categorias={categoriasOrdenadas}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
    </>
  );
}

function CardInsumo({
  insumo: i,
  categoria,
  onEditar,
  onExcluir,
}: {
  insumo: Insumo;
  categoria: string;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const { rotulo, valor } = valorExibicao(i);
  const volume = formatarVolume(i.volume, i.unidade, true);
  return (
    <li
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center ring-1 ring-foreground/10",
        // Ao passar o mouse (ou focar um botão): sobe, ganha sombra e borda laranja.
        "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-highlight/70",
        "focus-within:-translate-y-1 focus-within:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0",
      )}
    >
      <span className="max-w-full truncate rounded-full bg-primary-soft px-2 py-0.5 text-[9px] font-semibold tracking-wide text-primary uppercase">
        {categoria}
      </span>
      <h3 className="line-clamp-2 flex min-h-8 items-center text-xs leading-tight font-semibold tracking-wide uppercase" title={i.nome}>
        {i.nome}
      </h3>
      <div>
        <p className="text-xl font-bold tabular-nums">{formatarMoeda(i.custo)}</p>
        <p className="text-[11px] text-muted-foreground">
          Total pago
          {i.perda > 0 && (
            <span className="ml-1 rounded bg-highlight-soft px-1 py-px font-medium text-highlight-foreground">
              Perda {i.perda.toLocaleString("pt-BR")}%
            </span>
          )}
        </p>
      </div>
      <dl className="grid w-full grid-cols-2 gap-1.5 text-left">
        <div className="min-w-0 rounded-lg bg-muted px-1.5 py-1.5">
          <dt className="truncate text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">{rotulo}</dt>
          <dd className="truncate text-xs font-semibold tabular-nums" title={formatarMoedaPrecisa(valor)}>
            {formatarMoedaPrecisa(valor)}
          </dd>
        </div>
        <div className="min-w-0 rounded-lg bg-muted px-1.5 py-1.5">
          <dt className="text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">Volume</dt>
          <dd className="truncate text-xs font-semibold tabular-nums" title={volume}>
            {volume}
          </dd>
        </div>
      </dl>
      <div className="grid w-full grid-cols-2 gap-1.5">
        <Button variant="outline" size="sm" onClick={onEditar} className="h-8 text-xs" aria-label={`Editar ${i.nome}`}>
          <Pencil data-icon="inline-start" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExcluir}
          className="h-8 border-destructive/30 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Excluir ${i.nome}`}
        >
          <Trash data-icon="inline-start" />
          Excluir
        </Button>
      </div>
    </li>
  );
}

function AbaCategorias({
  categorias,
  onNova,
  onEditar,
  onExcluir,
}: {
  categorias: Categoria[];
  onNova: () => void;
  onEditar: (c: Categoria) => void;
  onExcluir: (c: Categoria) => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Crie e organize as categorias dos seus insumos. Renomear atualiza todos os insumos automaticamente.
        </p>
        <Button variant="highlight" size="lg" className="h-10 shrink-0" onClick={onNova}>
          <Plus data-icon="inline-start" />
          Nova categoria
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {categorias.map((c) => (
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
              <span className="block text-xs text-muted-foreground">{plural(c.insumos, "insumo", "insumos")}</span>
            </span>
            {!c.sistema && (
              <span className="flex shrink-0">
                <Button variant="ghost" size="icon" onClick={() => onEditar(c)} aria-label={`Editar ${c.nome}`} title="Editar">
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onExcluir(c)}
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
    </section>
  );
}
