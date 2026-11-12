"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bike,
  Copy,
  FileText,
  LayoutGrid,
  List,
  LoaderCircle,
  Pencil,
  Plus,
  Rows3,
  Star,
  Tag,
  Tags,
  Trash,
} from "lucide-react";
import { cn } from "cn";

import {
  BannerCadastro,
  CabecalhoLista,
  VazioCadastro,
} from "@/components/cadastro";
import { SelectNativo } from "@/components/cadastro/select-nativo";
import { notificar } from "@/components/notificacoes";
import { Button } from "@/components/ui/button";
import { formatarMoeda, formatarPercentual } from "@/lib/numero-br";
import { compararNome, normalizar, plural } from "@/lib/texto";

import { alternarFavorito, duplicarFicha } from "./actions";
import { classificarMargem, type TipoFicha } from "./calculo";
import {
  ModalCategoriaFicha,
  ModalExcluirCategoriaFicha,
} from "./modais-categoria";
import { BASE, INFO_TIPO, type CategoriaFicha } from "./tipos";

export type ItemLista = {
  id: string;
  nome: string;
  categoriaId: string | null;
  favorito: boolean;
  pesoTotalG: number | null;
  custoTotal: number;
  custoKg: number | null;
  custoPorcao: number;
  preco: number | null;
  margem: number | null;
  /** Preço em cada app de entrega (só produtos). */
  marketplace: { nome: string; preco: number }[];
  atualizadoEm: string;
};

type Visao = "grade" | "lista";
const CHAVE_VISAO = "foodlilly:fichas-visao";

function lerVisao(): Visao {
  try {
    return localStorage.getItem(CHAVE_VISAO) === "lista" ? "lista" : "grade";
  } catch {
    return "grade";
  }
}
function assinarVisao(avisar: () => void) {
  window.addEventListener(CHAVE_VISAO, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(CHAVE_VISAO, avisar);
    window.removeEventListener("storage", avisar);
  };
}

const ordens = {
  "nome-asc": "Nome (A–Z)",
  "nome-desc": "Nome (Z–A)",
  "maior-custo": "Maior custo",
  "menor-custo": "Menor custo",
  recentes: "Editados recentemente",
};
type Ordem = keyof typeof ordens;

export function ListaFichas({
  tipo,
  itens,
  categorias,
}: {
  tipo: TipoFicha;
  itens: ItemLista[];
  categorias: CategoriaFicha[];
}) {
  const info = INFO_TIPO[tipo];
  const router = useRouter();
  const params = useSearchParams();
  const [aba, setAba] = useState<"lista" | "categorias">(
    params.get("aba") === "categorias" ? "categorias" : "lista",
  );
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("nome-asc");
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [modal, setModal] = useState<
    | { tipo: "nova" }
    | { tipo: "editar"; categoria: CategoriaFicha }
    | { tipo: "excluir"; categoria: CategoriaFicha }
    | null
  >(null);
  const [ocupado, startAcao] = useTransition();
  const [acaoEm, setAcaoEm] = useState<string>();
  // Grade ou lista: lembrada neste navegador.
  const visao = useSyncExternalStore(assinarVisao, lerVisao, () => "grade" as Visao);
  function escolherVisao(v: Visao) {
    try {
      localStorage.setItem(CHAVE_VISAO, v);
    } catch {}
    window.dispatchEvent(new Event(CHAVE_VISAO));
  }

  const nomeCategoria = new Map(categorias.map((c) => [c.id, c.nome]));
  const termo = normalizar(busca);
  const visiveis = itens
    .filter((i) => !soFavoritos || i.favorito)
    .filter(
      (i) =>
        !categoria ||
        (categoria === "sem" ? !i.categoriaId : i.categoriaId === categoria),
    )
    .filter(
      (i) =>
        !termo ||
        normalizar(
          `${i.nome} ${nomeCategoria.get(i.categoriaId ?? "") ?? ""}`,
        ).includes(termo),
    )
    .sort((a, b) => {
      switch (ordem) {
        case "nome-asc":
          return compararNome(a, b);
        case "nome-desc":
          return compararNome(b, a);
        case "maior-custo":
          return b.custoPorcao - a.custoPorcao;
        case "menor-custo":
          return a.custoPorcao - b.custoPorcao;
        case "recentes":
          return b.atualizadoEm.localeCompare(a.atualizadoEm);
      }
    });

  function favoritar(item: ItemLista) {
    setAcaoEm(item.id);
    startAcao(async () => {
      const r = await alternarFavorito(item.id, !item.favorito);
      if (!r.ok) notificar.erro("Não foi possível favoritar", r.mensagem);
    });
  }

  function duplicar(item: ItemLista) {
    setAcaoEm(item.id);
    startAcao(async () => {
      const r = await duplicarFicha(item.id);
      if (r.ok) notificar.sucesso("Ficha duplicada", `${item.nome} (cópia)`);
      else notificar.erro("Não foi possível duplicar", r.mensagem);
    });
  }

  const abas = (
    <div role="tablist" aria-label="Seções" className="flex flex-wrap gap-2">
      {(
        [
          ["lista", info.titulo, List],
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
        titulo={info.titulo}
        descricao={info.descricao}
        icone={info.icone}
        abas={abas}
        semFerramentas={aba === "categorias"}
        resumo={
          aba === "lista"
            ? [
                { texto: plural(itens.length, info.singular, info.plural) },
                {
                  texto:
                    tipo === "massa"
                      ? plural(
                          itens.filter((i) => i.favorito).length,
                          "favorita",
                          "favoritas",
                        )
                      : plural(
                          itens.filter((i) => i.favorito).length,
                          "favorito",
                          "favoritos",
                        ),
                  icone: Star,
                },
              ]
            : undefined
        }
        busca={busca}
        onBusca={setBusca}
        placeholderBusca={`Buscar ${info.plural}...`}
        ordens={ordens}
        ordem={ordem}
        onOrdem={setOrdem}
        onNovo={() => router.push(`${BASE}/${info.segmento}/nova`)}
      />

      {aba === "lista" ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              size="lg"
              aria-pressed={soFavoritos}
              onClick={() => setSoFavoritos((v) => !v)}
              className={cn(
                "h-10",
                soFavoritos &&
                  "border-highlight bg-highlight-soft text-highlight-foreground hover:bg-highlight-soft",
              )}
            >
              <Star
                data-icon="inline-start"
                className={cn(soFavoritos && "fill-current")}
              />
              Favorit{tipo === "massa" ? "as" : "os"}
            </Button>
            <div className="sm:w-64">
              <label htmlFor="filtro-categoria" className="sr-only">
                Filtrar por categoria
              </label>
              <SelectNativo
                id="filtro-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="">Todas as categorias</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
                <option value="sem">Sem categoria</option>
              </SelectNativo>
            </div>
            <div
              role="radiogroup"
              aria-label="Exibição"
              className="flex h-10 shrink-0 rounded-lg bg-card p-1 ring-1 ring-foreground/10 sm:ml-auto"
            >
              {(
                [
                  ["grade", "Grade", LayoutGrid],
                  ["lista", "Lista", Rows3],
                ] as const
              ).map(([valor, rotulo, Icone]) => (
                <button
                  key={valor}
                  type="button"
                  role="radio"
                  aria-checked={visao === valor}
                  onClick={() => escolherVisao(valor)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    visao === valor
                      ? "bg-highlight text-highlight-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icone className="size-4" />
                  {rotulo}
                </button>
              ))}
            </div>
          </div>

          <CabecalhoLista
            icone={info.icone}
            titulo={`${info.titulo} cadastrad${tipo === "massa" ? "as" : "os"}`}
            info={
              visiveis.length === itens.length
                ? plural(itens.length, info.singular, info.plural)
                : `${visiveis.length} de ${itens.length}`
            }
          />

          {visiveis.length ? (
            <ul
              className={
                visao === "grade"
                  ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col gap-2"
              }
            >
              {visiveis.map((item) => (
                <CardFicha
                  key={item.id}
                  item={item}
                  tipo={tipo}
                  visao={visao}
                  categoria={
                    nomeCategoria.get(item.categoriaId ?? "") ?? "Sem categoria"
                  }
                  ocupado={ocupado && acaoEm === item.id}
                  onFavoritar={() => favoritar(item)}
                  onDuplicar={() => duplicar(item)}
                />
              ))}
            </ul>
          ) : (
            <VazioCadastro
              icone={info.icone}
              busca={
                termo
                  ? busca
                  : soFavoritos || categoria
                    ? "filtros escolhidos"
                    : undefined
              }
              textoVazio={`Nenhum${tipo === "massa" ? "a" : ""} ${info.singular} cadastrad${tipo === "massa" ? "a" : "o"} ainda.`}
              dicaVazia="Monte a ficha técnica com os ingredientes, a mão de obra e os equipamentos para saber o custo real."
              rotuloNovo={`Nov${tipo === "massa" ? "a" : "o"} ${info.singular}`}
              onLimpar={() => {
                setBusca("");
                setSoFavoritos(false);
                setCategoria("");
              }}
              onNovo={() => router.push(`${BASE}/${info.segmento}/nova`)}
            />
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Organize{" "}
              {tipo === "massa" ? "suas massas" : `seus ${info.plural}`} em
              categorias. Excluir uma categoria não apaga nada: você escolhe
              para onde os itens vão.
            </p>
            <Button
              variant="highlight"
              size="lg"
              className="h-10 shrink-0"
              onClick={() => setModal({ tipo: "nova" })}
            >
              <Plus data-icon="inline-start" />
              Nova categoria
            </Button>
          </div>
          {categorias.length ? (
            <ul className="flex flex-col gap-2">
              {[...categorias].sort(compararNome).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
                >
                  <Tag className="size-4 shrink-0 text-highlight-strong" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{c.nome}</span>
                    <span className="block text-xs text-muted-foreground">
                      {plural(c.fichas, info.singular, info.plural)}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModal({ tipo: "editar", categoria: c })}
                    aria-label={`Editar ${c.nome}`}
                    title="Editar"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModal({ tipo: "excluir", categoria: c })}
                    aria-label={`Excluir ${c.nome}`}
                    title="Excluir"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-card px-4 py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
              Nenhuma categoria criada ainda.
            </p>
          )}
        </section>
      )}

      {(modal?.tipo === "nova" || modal?.tipo === "editar") && (
        <ModalCategoriaFicha
          key={modal.tipo === "editar" ? modal.categoria.id : "nova"}
          tipo={tipo}
          categoria={modal.tipo === "editar" ? modal.categoria : undefined}
          onFechar={() => setModal(null)}
          onConcluido={(titulo, descricao) => {
            setModal(null);
            notificar.sucesso(titulo, descricao);
          }}
        />
      )}
      {modal?.tipo === "excluir" && (
        <ModalExcluirCategoriaFicha
          tipo={tipo}
          categoria={modal.categoria}
          categorias={categorias}
          onFechar={() => setModal(null)}
          onConcluido={(titulo, descricao) => {
            setModal(null);
            notificar.sucesso(titulo, descricao);
          }}
        />
      )}
    </>
  );
}

function CardFicha({
  item,
  tipo,
  visao,
  categoria,
  ocupado,
  onFavoritar,
  onDuplicar,
}: {
  item: ItemLista;
  tipo: TipoFicha;
  visao: Visao;
  categoria: string;
  ocupado: boolean;
  onFavoritar: () => void;
  onDuplicar: () => void;
}) {
  const info = INFO_TIPO[tipo];
  const produto = tipo === "produto";
  const classe =
    produto && item.preco != null && item.margem != null
      ? classificarMargem(item.margem)
      : null;
  const metricas: { rotulo: string; valor: string; destaque?: boolean }[] =
    produto
      ? [
          { rotulo: "Custo", valor: formatarMoeda(item.custoPorcao) },
          {
            rotulo: "Venda",
            valor: item.preco != null ? formatarMoeda(item.preco) : "—",
            destaque: item.preco != null,
          },
          {
            rotulo: "Margem",
            valor:
              item.margem != null
                ? formatarPercentual(item.margem / 100, 0)
                : "—",
            destaque: classe?.rotulo === "Boa",
          },
        ]
      : [
          {
            rotulo: "Peso",
            valor: item.pesoTotalG
              ? `${item.pesoTotalG.toLocaleString("pt-BR")} g`
              : "—",
          },
          {
            rotulo: "Custo/kg",
            valor: item.custoKg != null ? formatarMoeda(item.custoKg) : "—",
          },
          { rotulo: "Custo/un.", valor: formatarMoeda(item.custoPorcao) },
        ];

  const [app, ...outrosApps] = item.marketplace;
  const marketplace = app && (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-card px-2 py-1 text-xs font-semibold text-foreground shadow-sm ring-1 ring-foreground/10"
      title={item.marketplace
        .map((m) => `${m.nome}: ${formatarMoeda(m.preco)}`)
        .join("\n")}
    >
      <Bike className="size-3.5 shrink-0 text-highlight-strong" />
      <span className="truncate text-muted-foreground">{app.nome}</span>
      <span className="tabular-nums">{formatarMoeda(app.preco)}</span>
      {outrosApps.length > 0 && (
        <span
          className="rounded-full bg-highlight-soft px-1.5 text-[10px] text-highlight-foreground"
          aria-label={`e mais ${outrosApps.length} apps`}
        >
          +{outrosApps.length}
        </span>
      )}
    </span>
  );

  const metricasDl = (compacto: boolean) => (
    <dl
      className={cn(
        "grid grid-cols-3 gap-1.5",
        compacto && "sm:w-80 sm:shrink-0",
      )}
    >
      {metricas.map((m) => (
        <div
          key={m.rotulo}
          className={cn(
            "min-w-0 rounded-lg px-2 py-1.5",
            m.destaque ? "bg-success/10" : "bg-muted",
          )}
        >
          <dt className="truncate text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
            {m.rotulo}
          </dt>
          <dd
            className={cn(
              "truncate text-xs font-semibold tabular-nums",
              m.destaque && "text-success",
            )}
            title={m.valor}
          >
            {m.valor}
          </dd>
        </div>
      ))}
    </dl>
  );

  const acoes = (largo: boolean) => (
    <div className={cn("flex gap-1.5", largo ? "mt-auto" : "shrink-0")}>
      <Button
        variant="highlight"
        className={cn("h-9", largo && "flex-1")}
        render={<Link href={`${BASE}/ficha/${item.id}`} />}
        aria-label={largo ? undefined : `Ver ficha técnica de ${item.nome}`}
      >
        <FileText data-icon="inline-start" />
        {largo ? (
          "Ver ficha técnica"
        ) : (
          <span className="max-sm:sr-only">Ver ficha</span>
        )}
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="size-9"
        onClick={onFavoritar}
        disabled={ocupado}
        aria-pressed={item.favorito}
        aria-label={
          item.favorito
            ? `Remover ${item.nome} dos favoritos`
            : `Favoritar ${item.nome}`
        }
        title={item.favorito ? "Remover dos favoritos" : "Favoritar"}
      >
        <Star
          className={cn(
            item.favorito && "fill-highlight text-highlight-strong",
          )}
        />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="size-9"
        onClick={onDuplicar}
        disabled={ocupado}
        aria-label={`Duplicar ${item.nome}`}
        title="Duplicar"
      >
        {ocupado ? <LoaderCircle className="animate-spin" /> : <Copy />}
      </Button>
    </div>
  );

  if (visao === "lista") {
    return (
      <li className="flex flex-col gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 transition-shadow hover:shadow-md hover:ring-highlight/70 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground/70">
            <info.icone className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-1.5 font-semibold">
              <span className="truncate" title={item.nome}>
                {item.nome}
              </span>
              {item.favorito && (
                <Star
                  className="size-3.5 shrink-0 fill-highlight text-highlight"
                  aria-label="Favorito"
                />
              )}
            </h3>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="truncate">{categoria}</span>
              {classe && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                    classe.classe,
                  )}
                >
                  Margem {classe.rotulo.toLowerCase()}
                </span>
              )}
            </p>
          </div>
        </div>
        {marketplace && (
          <div className="sm:w-44 sm:shrink-0">{marketplace}</div>
        )}
        {metricasDl(true)}
        {acoes(false)}
      </li>
    );
  }

  return (
    <li
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10",
        "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-highlight/70",
        "focus-within:-translate-y-1 focus-within:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0",
      )}
    >
      <div className="relative flex h-24 items-center justify-center bg-gradient-to-br from-primary to-primary-strong text-primary-foreground/30">
        <info.icone className="size-12" />
        {item.favorito && (
          <Star
            className="absolute top-3 left-3 size-4 fill-highlight text-highlight"
            aria-label="Favorito"
          />
        )}
        {marketplace && (
          <div className="absolute top-2.5 right-2.5 left-9 flex justify-end">
            {marketplace}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold" title={item.nome}>
            {item.nome}
          </h3>
          <p className="truncate text-xs text-muted-foreground">{categoria}</p>
        </div>
        {metricasDl(false)}
        {acoes(true)}
      </div>
      {classe && (
        <p
          className={cn(
            "flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold",
            classe.classe,
          )}
        >
          <span className="size-1.5 rounded-full bg-current" aria-hidden />
          Margem {classe.rotulo.toLowerCase()}
        </p>
      )}
    </li>
  );
}
