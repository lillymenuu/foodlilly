"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Box,
  CirclePlus,
  Clock,
  Cog,
  Copy,
  HandCoins,
  ListOrdered,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  Save,
  Scale,
  ShoppingBag,
  Soup,
  Store,
  Trash,
  Users,
  Utensils,
  Wheat,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import { ModalExcluir } from "@/components/cadastro";
import { SelectNativo } from "@/components/cadastro/select-nativo";
import { Aviso, BotaoSalvar } from "@/components/formulario";
import { notificar } from "@/components/notificacoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatarMoeda,
  formatarMoedaPrecisa,
  formatarPercentual,
  mascaraMilhar,
  paraNumero,
  paraTexto,
} from "@/lib/numero-br";
import { compararNome, plural } from "@/lib/texto";

import { duplicarFicha, excluirFicha, salvarFicha } from "./actions";
import {
  calcularFicha,
  classificarMargem,
  type Contexto,
  type EquipamentoRef,
  type FichaBase,
  type FuncionarioRef,
  type InsumoRef,
  type ItemFicha,
  type Parametros,
  type ResumoRef,
  type TipoFicha,
  type TipoItem,
} from "./calculo";
import { ModalCategoriaFicha } from "./modais-categoria";
import { ModalItem, ROTULO_ITEM, type OpcaoItem } from "./modal-item";
import {
  BASE,
  INFO_TIPO,
  LIMITES,
  MARGEM_PADRAO,
  MARGEM_REVENDA_PADRAO,
  type CategoriaFicha,
  type DadosFicha,
} from "./tipos";

export type PropsEditor = {
  tipo: TipoFicha;
  ficha: FichaBase | null;
  insumos: InsumoRef[];
  funcionarios: FuncionarioRef[];
  equipamentos: EquipamentoRef[];
  parametros: Parametros;
  /** Fichas que podem ser vinculadas (já sem as que criariam ciclo). */
  fichasRef: (ResumoRef & { id: string })[];
  /** Categorias por tipo (a receita pode alternar entre massa e recheio). */
  categoriasPorTipo: Record<TipoFicha, CategoriaFicha[]>;
  /** Fichas que usam esta (produtos primeiro), com as gramas usadas. */
  usadoEm: {
    id: string;
    nome: string;
    tipo: TipoFicha;
    preco: number | null;
    gramas: number;
  }[];
};

const SECOES: Record<
  TipoItem,
  { titulo: string; icone: LucideIcon; vazio: string }
> = {
  ingrediente: {
    titulo: "Ingredientes",
    icone: Wheat,
    vazio: "Nenhum ingrediente adicionado.",
  },
  embalagem: {
    titulo: "Embalagens",
    icone: Box,
    vazio: "Nenhuma embalagem adicionada.",
  },
  receita: {
    titulo: "Receitas",
    icone: Soup,
    vazio: "Nenhuma receita vinculada.",
  },
  produto: {
    titulo: "Produtos",
    icone: ShoppingBag,
    vazio: "Nenhum produto vinculado.",
  },
  mao_obra: {
    titulo: "Mão de obra",
    icone: Users,
    vazio: "Nenhum profissional adicionado.",
  },
  equipamento: {
    titulo: "Equipamentos",
    icone: Cog,
    vazio: "Nenhum equipamento adicionado.",
  },
};

const texto = (n: number | null | undefined, casas?: number) =>
  n == null ? "" : paraTexto(n, casas);
const numeroOuNull = (t: string) => {
  const n = paraNumero(t);
  return n == null || Number.isNaN(n) ? null : n;
};

type Estado = {
  nome: string;
  categoriaId: string;
  rendimento: string;
  peso: string;
  /** Massa ou recheio podem ser trocados; produto fica fixo. */
  tipo: TipoFicha;
  margem: string;
  margemRevenda: string;
  itens: ItemFicha[];
  passos: string[];
};

function estadoInicial(tipo: TipoFicha, f: FichaBase | null): Estado {
  return {
    nome: f?.nome ?? "",
    categoriaId: f?.categoriaId ?? "",
    rendimento: texto(f?.rendimento ?? 1),
    peso: mascaraMilhar(texto(f?.pesoTotalG)),
    tipo: f?.tipo ?? tipo,
    // Só produtos têm margem; sem valor salvo, começa com a margem padrão.
    margem: tipo === "produto" ? texto(f?.margem ?? MARGEM_PADRAO) : "",
    margemRevenda: texto(f?.margemRevenda),
    itens: f?.itens ?? [],
    passos: f?.modoPreparo ?? [],
  };
}

export function EditorFicha(props: PropsEditor) {
  const { tipo: tipoInicial, ficha } = props;
  const router = useRouter();
  const [estado, setEstado] = useState(() => estadoInicial(tipoInicial, ficha));
  const [salvo, setSalvo] = useState(() =>
    JSON.stringify(estadoInicial(tipoInicial, ficha)),
  );
  const tipo = estado.tipo;
  const info = INFO_TIPO[tipo];
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvando, startSalvar] = useTransition();
  const [duplicando, startDuplicar] = useTransition();
  const [modal, setModal] = useState<
    | { tipo: "item"; item: TipoItem; indice?: number }
    | { tipo: "categoria" }
    | { tipo: "excluir" }
    | null
  >(null);
  const [categoriasCriadas, setCategoriasCriadas] = useState<
    (CategoriaFicha & { tipo: TipoFicha })[]
  >([]);
  const [novoPasso, setNovoPasso] = useState("");

  // Ficha salva abre só para visualizar; "Editar" libera os campos. Ficha nova já abre editando.
  const [editando, setEditando] = useState(!ficha);
  const leitura = Boolean(ficha) && !editando;

  // Ficha nova só conta como alterada depois que algo é preenchido.
  const alterado = JSON.stringify(estado) !== salvo;
  // Valor atual para a limpeza ao esconder a página (que roda com valores antigos).
  const alteradoRef = useRef(alterado);
  useEffect(() => {
    alteradoRef.current = alterado;
  }, [alterado]);

  function cancelarEdicao() {
    setEstado(JSON.parse(salvo) as Estado);
    setErros({});
    setErroGeral(undefined);
    setNovoPasso("");
    setEditando(false);
  }
  const set = <K extends keyof Estado>(chave: K, valor: Estado[K]) => {
    setEstado((e) => ({ ...e, [chave]: valor }));
    setErros((x) => ({ ...x, [chave === "peso" ? "pesoTotalG" : chave]: "" }));
  };

  // O Next 16 (Cache Components) não desmonta a página ao navegar: ela fica
  // escondida (<Activity>) com o estado preservado. Ao esconder:
  // - ficha NOVA volta em branco (cada "Novo" começa do zero);
  // - modais fecham (ficha existente mantém as edições como rascunho).
  useLayoutEffect(() => {
    return () => {
      setModal(null);
      if (ficha && !alteradoRef.current) setEditando(false);
      if (!ficha) {
        const inicial = estadoInicial(tipoInicial, null);
        setEstado(inicial);
        setSalvo(JSON.stringify(inicial));
        setErros({});
        setErroGeral(undefined);
        setNovoPasso("");
      }
    };
  }, [ficha, tipoInicial]);

  // Avisa antes de sair da página com alterações não salvas.
  useEffect(() => {
    if (!alterado) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [alterado]);

  const ctx: Contexto = useMemo(
    () => ({
      insumos: new Map(props.insumos.map((i) => [i.id, i])),
      funcionarios: new Map(props.funcionarios.map((f) => [f.id, f])),
      equipamentos: new Map(props.equipamentos.map((e) => [e.id, e])),
      parametros: props.parametros,
    }),
    [props.insumos, props.funcionarios, props.equipamentos, props.parametros],
  );
  const refs = useMemo(
    () => new Map(props.fichasRef.map((f) => [f.id, f])),
    [props.fichasRef],
  );

  const resultado = calcularFicha(
    {
      tipo,
      rendimento: numeroOuNull(estado.rendimento) ?? 1,
      pesoTotalG: numeroOuNull(estado.peso),
      margem: numeroOuNull(estado.margem),
      margemRevenda: numeroOuNull(estado.margemRevenda),
      itens: estado.itens,
    },
    ctx,
    (id) => refs.get(id),
  );

  const doTipo = props.categoriasPorTipo[tipo] ?? [];
  const categorias = [
    ...doTipo,
    ...categoriasCriadas.filter(
      (c) => c.tipo === tipo && !doTipo.some((x) => x.id === c.id),
    ),
  ].sort(compararNome);

  /** Tempo de preparo = minutos de mão de obra + equipamentos (como na referência). */
  const tempoPreparo = estado.itens
    .filter((i) => i.tipo === "mao_obra" || i.tipo === "equipamento")
    .reduce((s, i) => s + i.quantidade, 0);

  function trocarTipo(novo: TipoFicha) {
    if (novo === tipo) return;
    // Cada tipo tem as próprias categorias: a escolhida deixa de valer.
    setEstado((e) => ({ ...e, tipo: novo, categoriaId: "" }));
    setErros((x) => ({ ...x, categoriaId: "" }));
  }

  function opcoesDe(item: TipoItem): OpcaoItem[] {
    const unidade = (u: string) => (u === "unidade" ? "un." : u);
    if (item === "ingrediente" || item === "embalagem") {
      const ordem = (i: InsumoRef) =>
        item === "embalagem" ? (i.embalagem ? 0 : 1) : i.embalagem ? 1 : 0;
      return [...props.insumos]
        .sort(
          (a, b) =>
            ordem(a) - ordem(b) ||
            a.categoria.localeCompare(b.categoria, "pt-BR") ||
            compararNome(a, b),
        )
        .map((i) => ({
          id: i.id,
          nome: i.nome,
          grupo: i.categoria,
          unidade: unidade(i.unidade),
          detalhe: `${formatarMoedaPrecisa(i.custoUnitario)}/${unidade(i.unidade)}`,
        }));
    }
    if (item === "receita" || item === "produto") {
      return props.fichasRef
        .filter((f) =>
          item === "produto" ? f.tipo === "produto" : f.tipo !== "produto",
        )
        .sort((a, b) => a.tipo.localeCompare(b.tipo) || compararNome(a, b))
        .map((f) => ({
          id: f.id,
          nome: f.nome,
          grupo: INFO_TIPO[f.tipo].titulo,
          unidade: "g",
          detalhe: f.pesoTotalG
            ? `${f.pesoTotalG.toLocaleString("pt-BR")} g · ${formatarMoeda(f.custoTotal)}`
            : undefined,
          aviso: f.pesoTotalG
            ? undefined
            : "Sem peso total: informe o peso na ficha dela para calcular.",
        }));
    }
    if (item === "mao_obra") {
      return [...props.funcionarios].sort(compararNome).map((f) => ({
        id: f.id,
        nome: f.nome,
        grupo: "Funcionários",
        unidade: "min",
        detalhe: `${formatarMoedaPrecisa(f.custoMinuto * 60)}/hora`,
      }));
    }
    return [...props.equipamentos].sort(compararNome).map((e) => ({
      id: e.id,
      nome: e.nome,
      grupo: "Equipamentos",
      unidade: "min",
      detalhe: e.detalhe,
    }));
  }

  function confirmarItem(
    item: TipoItem,
    refId: string,
    quantidade: number,
    indice?: number,
  ) {
    setEstado((e) => {
      const itens = [...e.itens];
      const existente = itens.findIndex(
        (i, n) => n !== indice && i.tipo === item && i.refId === refId,
      );
      if (indice != null) itens[indice] = { tipo: item, refId, quantidade };
      else if (existente >= 0)
        itens[existente] = { tipo: item, refId, quantidade };
      else itens.push({ tipo: item, refId, quantidade });
      return { ...e, itens };
    });
    setModal(null);
  }

  function removerItem(indice: number) {
    setEstado((e) => ({ ...e, itens: e.itens.filter((_, n) => n !== indice) }));
  }

  function adicionarPasso() {
    const t = novoPasso.trim();
    if (!t) return;
    if (estado.passos.length >= LIMITES.passos) {
      notificar.info(
        "Limite de passos",
        `Use no máximo ${LIMITES.passos} passos.`,
      );
      return;
    }
    set("passos", [...estado.passos, t.slice(0, LIMITES.passo)]);
    setNovoPasso("");
  }

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (salvando) return;
    const e: Record<string, string> = {};
    const rendimento = numeroOuNull(estado.rendimento);
    const peso = numeroOuNull(estado.peso);
    const margem = numeroOuNull(estado.margem);
    const margemRevenda = numeroOuNull(estado.margemRevenda);
    if (!estado.nome.trim()) e.nome = "Informe o nome.";
    if (!rendimento || rendimento <= 0) e.rendimento = "Informe o rendimento.";
    if (estado.peso.trim() && (!peso || peso <= 0))
      e.pesoTotalG = "Peso inválido.";
    if (!peso) e.pesoTotalG = "Informe o peso total.";
    if (tipo !== "produto" && !estado.categoriaId)
      e.categoriaId = "Escolha uma categoria.";
    if (tipo === "produto" && (margem == null || margem < 0 || margem > 95))
      e.margem = "Use de 0 a 95%.";
    if (
      estado.margemRevenda.trim() &&
      (margemRevenda == null || margemRevenda < 0 || margemRevenda > 95)
    )
      e.margemRevenda = "Use de 0 a 95%.";
    if (Object.keys(e).length) {
      setErros(e);
      setErroGeral("Confira os campos destacados.");
      return;
    }

    const dados: DadosFicha = {
      tipo,
      nome: estado.nome.trim(),
      categoriaId: estado.categoriaId || null,
      rendimento: rendimento!,
      pesoTotalG: peso,
      tempoPreparoMin: Math.round(tempoPreparo),
      margem: tipo === "produto" ? margem : null,
      margemRevenda: tipo === "produto" ? margemRevenda : null,
      modoPreparo: estado.passos,
      itens: estado.itens,
    };
    startSalvar(async () => {
      const r = await salvarFicha(ficha?.id ?? null, dados);
      if (!r.ok) {
        setErros(r.erros ?? {});
        setErroGeral(r.mensagem);
        return;
      }
      setErros({});
      setErroGeral(undefined);
      setSalvo(JSON.stringify(estado));
      setEditando(false);
      notificar.sucesso(
        ficha
          ? "Ficha atualizada"
          : `${info.singular[0].toUpperCase()}${info.singular.slice(1)} criad${tipo === "massa" ? "a" : "o"}`,
        dados.nome,
      );
      if (!ficha && r.id) router.replace(`${BASE}/ficha/${r.id}`);
    });
  }

  function duplicar() {
    if (!ficha) return;
    startDuplicar(async () => {
      const r = await duplicarFicha(ficha.id);
      if (r.ok && r.id) {
        notificar.sucesso("Ficha duplicada", `${ficha.nome} (cópia)`);
        router.push(`${BASE}/ficha/${r.id}`);
      } else
        notificar.erro(
          "Não foi possível duplicar",
          r.ok ? undefined : r.mensagem,
        );
    });
  }

  const p = resultado.preco;
  const usadoProdutos = props.usadoEm.filter((u) => u.tipo === "produto");
  const usadoReceitas = props.usadoEm.filter((u) => u.tipo !== "produto");
  /** Soma dos preços de venda dos produtos que usam esta ficha. */
  const totalVendas = usadoProdutos.reduce((s, u) => s + (u.preco ?? 0), 0);
  const pesoCampo = (
    <CampoNumeroFicha
      leitura={leitura}
      id="peso"
      rotulo="Peso total"
      icone={Scale}
      sufixo="g"
      valor={estado.peso}
      erro={erros.pesoTotalG}
      pendente={tipo === "produto" && !estado.peso.trim()}
      dica={
        tipo === "produto" ? "Peso do produto pronto." : "Peso final pronto."
      }
      // Máscara de milhar: "2700" vira "2.700".
      onAlterar={(v) => set("peso", mascaraMilhar(v))}
    />
  );
  /** Sem nenhum item: os custos aparecem como "—", como na referência. */
  const vazia = estado.itens.length === 0;
  const margemNum = numeroOuNull(estado.margem) ?? 0;
  const contagem = (t: TipoItem[]) =>
    estado.itens.filter((i) => t.includes(i.tipo)).length;
  // O que falta para a ficha fazer sentido (aviso abaixo do Salvar).
  const pendencias = [
    !estado.nome.trim() && "nome",
    !estado.peso.trim() && "peso total",
    tipo !== "produto" && !estado.categoriaId && "categoria",
    estado.itens.length === 0 && "composição",
  ].filter(Boolean) as string[];
  // Selo só nos produtos (classificação da margem).
  const selo =
    tipo === "produto"
      ? {
          ...classificarMargem(margemNum),
          dica: "Classificação da margem de lucro",
        }
      : null;
  const FORM = "form-ficha";

  return (
    <form id={FORM} onSubmit={salvar} noValidate className="contents">
      {/* Cabeçalho: nome, categoria e números */}
      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-6">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
              <info.icone className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Ficha técnica · {info.singular}
                {selo && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] tracking-normal normal-case",
                      selo.classe,
                    )}
                    title={selo.dica}
                  >
                    {selo.rotulo}
                  </span>
                )}
              </p>
              <label htmlFor="ficha-nome" className="sr-only">
                Nome
              </label>
              <div className="relative">
                <input
                  id="ficha-nome"
                  value={estado.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  maxLength={LIMITES.nome}
                  placeholder={`Nome d${tipo === "massa" ? "a" : "o"} ${info.singular}`}
                  aria-invalid={Boolean(erros.nome)}
                  autoFocus={!ficha}
                  readOnly={leitura}
                  className={cn(
                    "w-full border-b-2 border-transparent bg-transparent py-1 pr-9 text-2xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/60 aria-invalid:border-destructive sm:text-3xl",
                    !leitura && "hover:border-border focus:border-highlight",
                  )}
                />
                {leitura ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(true);
                      requestAnimationFrame(() =>
                        document.getElementById("ficha-nome")?.focus(),
                      );
                    }}
                    className="absolute top-1/2 right-0 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label="Editar ficha"
                    title="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                ) : (
                  <Pencil className="pointer-events-none absolute top-1/2 right-1.5 size-4 -translate-y-1/2 text-highlight-strong" />
                )}
              </div>
              {erros.nome && (
                <p className="mt-1 text-xs text-destructive">{erros.nome}</p>
              )}
            </div>
          </div>

          {/* Tipo da receita: massa ou recheio */}
          {tipo !== "produto" && (
            <div
              role="radiogroup"
              aria-label="Tipo da receita"
              className="inline-flex w-fit rounded-xl bg-muted p-1"
            >
              {(["massa", "recheio"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={tipo === t}
                  disabled={leitura}
                  onClick={() => trocarTipo(t)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    tipo === t
                      ? "bg-highlight text-highlight-foreground shadow-sm"
                      : "text-muted-foreground enabled:hover:text-foreground disabled:opacity-50",
                  )}
                >
                  {INFO_TIPO[t].titulo.slice(0, -1)}
                </button>
              ))}
            </div>
          )}

          {/* Categoria: alinhada à esquerda com os cards abaixo */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="w-full sm:w-72">
              <label htmlFor="ficha-categoria" className="sr-only">
                Categoria
              </label>
              <SelectNativo
                id="ficha-categoria"
                value={estado.categoriaId}
                onChange={(e) => set("categoriaId", e.target.value)}
                aria-invalid={Boolean(erros.categoriaId)}
                disabled={leitura}
                className="disabled:cursor-default disabled:opacity-100"
              >
                {/* Receita exige categoria; produto pode ficar sem. */}
                <option value="" disabled={tipo !== "produto"}>
                  {tipo === "produto"
                    ? "Sem categoria"
                    : "Selecione uma categoria"}
                </option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </SelectNativo>
              {erros.categoriaId && (
                <p className="mt-1 text-xs text-destructive">
                  {erros.categoriaId}
                </p>
              )}
            </div>
            {!leitura && (
              <button
                type="button"
                onClick={() => setModal({ tipo: "categoria" })}
                className="flex items-center gap-1 rounded text-xs font-semibold text-amber-700 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Plus className="size-3.5" />
                Nova categoria
              </button>
            )}
          </div>

          {/* Campos editáveis: produto tem margens; receita, o tempo de preparo */}
          <div
            className={cn(
              "grid grid-cols-2 gap-3",
              tipo === "produto" ? "lg:grid-cols-4" : "sm:grid-cols-3",
            )}
          >
            {tipo !== "produto" && pesoCampo}
            <CampoNumeroFicha
              leitura={leitura}
              id="rendimento"
              rotulo="Rendimento"
              icone={Utensils}
              sufixo="porções"
              valor={estado.rendimento}
              erro={erros.rendimento}
              onAlterar={(v) => set("rendimento", v)}
            />
            {tipo === "produto" ? (
              <>
                {pesoCampo}
                <CampoNumeroFicha
                  leitura={leitura}
                  id="margem"
                  rotulo="Margem"
                  icone={HandCoins}
                  sufixo="%"
                  valor={estado.margem}
                  erro={erros.margem}
                  onAlterar={(v) => set("margem", v)}
                >
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-highlight"
                      style={{ width: `${Math.min(100, margemNum)}%` }}
                    />
                  </div>
                </CampoNumeroFicha>
                <CampoNumeroFicha
                  leitura={leitura}
                  id="margemRevenda"
                  rotulo="Margem revenda"
                  icone={Store}
                  sufixo="%"
                  valor={estado.margemRevenda}
                  placeholder={String(MARGEM_REVENDA_PADRAO)}
                  dica={
                    estado.margemRevenda.trim()
                      ? undefined
                      : `Padrão: ${MARGEM_REVENDA_PADRAO}%`
                  }
                  erro={erros.margemRevenda}
                  onAlterar={(v) => set("margemRevenda", v)}
                />
              </>
            ) : (
              <div
                className="rounded-xl bg-muted/60 p-3"
                title="Soma dos minutos de mão de obra e equipamentos"
              >
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="size-3.5" />
                  Tempo de preparo
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {paraTexto(tempoPreparo)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    min
                  </span>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Mão de obra + equipamentos.
                </p>
              </div>
            )}
          </div>

          {/* Valores calculados, na ordem da referência */}
          {tipo === "produto" ? (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Numero
                rotulo="Custo total"
                valor={vazia ? "—" : formatarMoeda(resultado.custoTotal)}
              />
              <Numero
                rotulo="Preço venda"
                valor={p?.valido ? formatarMoeda(p.preco) : "—"}
                destaque="sucesso"
              />
              <Numero
                rotulo="Lucro/venda"
                valor={p?.valido ? formatarMoeda(p.lucro) : "—"}
              >
                {p?.valido && <Selo {...classificarMargem(margemNum)} />}
              </Numero>
              <Numero
                rotulo="Custo fabricação"
                valor={p ? formatarMoeda(p.fabricacao) : "—"}
                dica={`Inclui ${formatarPercentual(props.parametros.aliquotaFixa)} de custo fixo`}
              />
              <Numero
                rotulo="CMV"
                valor={vazia || !p?.valido ? "—" : formatarPercentual(p.cmvPct)}
                dica={vazia ? undefined : formatarMoeda(resultado.cmvPorcao)}
                destaque="sucesso"
              />
              <div className="rounded-xl bg-muted/60 p-3">
                <dt className="text-xs text-muted-foreground">Marketplace</dt>
                {!vazia && p?.valido && p.marketplace.length ? (
                  <dd className="mt-1 flex flex-col gap-0.5 text-sm">
                    {p.marketplace.map((m) => (
                      <span key={m.nome} className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{m.nome}</span>
                        <strong className="tabular-nums">
                          {formatarMoeda(m.preco)}
                        </strong>
                      </span>
                    ))}
                  </dd>
                ) : (
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {p && !p.marketplace.length && !vazia
                      ? "Configure as taxas em Dados de entrada."
                      : "Preços de marketplace aparecem ao montar a ficha."}
                  </dd>
                )}
              </div>
              <Numero
                rotulo="Preço por kg"
                valor={p?.valido && p.precoKg ? formatarMoeda(p.precoKg) : "—"}
              />
              <Numero
                rotulo="Custo/porção"
                valor={vazia ? "—" : formatarMoeda(resultado.custoPorcao)}
              />
              <Numero
                rotulo="Preço revenda"
                valor={p?.valido ? formatarMoeda(p.revenda) : "—"}
                dica={`Margem ${estado.margemRevenda.trim() || MARGEM_REVENDA_PADRAO}%`}
              />
            </dl>
          ) : (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <Numero
                rotulo="Custo total"
                valor={vazia ? "—" : formatarMoeda(resultado.custoTotal)}
              />
              <Numero
                rotulo="Custo/kg"
                valor={
                  resultado.custoKg != null && !vazia
                    ? formatarMoeda(resultado.custoKg)
                    : "—"
                }
                dica={
                  resultado.custoKg == null ? "Informe o peso total" : undefined
                }
              />
              <Numero
                rotulo="CMV"
                valor={vazia ? "—" : formatarMoeda(resultado.cmvPorcao)}
                dica="Ingredientes por porção"
                destaque="sucesso"
              />
              <Numero
                rotulo="Peso/porção"
                valor={
                  resultado.pesoPorcaoG != null
                    ? `${Math.round(resultado.pesoPorcaoG).toLocaleString("pt-BR")} g`
                    : "—"
                }
              />
              <Numero
                rotulo="Custo/porção"
                valor={vazia ? "—" : formatarMoeda(resultado.custoPorcao)}
              />
            </dl>
          )}
          {p && !p.valido && (
            <Aviso tipo="erro">
              Margem + imposto + taxa do cartão passam de 100%. Diminua a margem
              para calcular o preço.
            </Aviso>
          )}

          <p className="-mt-2 text-xs text-muted-foreground">
            Valores calculados em tempo real conforme você monta a ficha.
          </p>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                Ingredientes:{" "}
                <strong className="text-foreground">
                  {contagem(["ingrediente"])}
                </strong>
              </span>
              {tipo === "produto" && (
                <span>
                  Embalagens:{" "}
                  <strong className="text-foreground">
                    {contagem(["embalagem"])}
                  </strong>
                </span>
              )}
              <span>
                Receitas:{" "}
                <strong className="text-foreground">
                  {contagem(["receita"])}
                </strong>
              </span>
              {tipo === "produto" && (
                <span>
                  Produtos:{" "}
                  <strong className="text-foreground">
                    {contagem(["produto"])}
                  </strong>
                </span>
              )}
              {tipo !== "produto" && (
                <span>
                  Preparo:{" "}
                  <strong className="text-foreground">
                    {paraTexto(tempoPreparo)} min
                  </strong>
                </span>
              )}
              <span>
                Mão de obra:{" "}
                <strong className="text-foreground">
                  {contagem(["mao_obra"])}
                </strong>
              </span>
              <span>
                Equipamentos:{" "}
                <strong className="text-foreground">
                  {contagem(["equipamento"])}
                </strong>
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {leitura ? (
                <>
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => setEditando(true)}
                  >
                    <Pencil data-icon="inline-start" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={duplicar}
                    disabled={duplicando}
                  >
                    {duplicando ? (
                      <LoaderCircle
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                    ) : (
                      <Copy data-icon="inline-start" />
                    )}
                    Duplicar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setModal({ tipo: "excluir" })}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash data-icon="inline-start" />
                    Excluir
                  </Button>
                </>
              ) : (
                <>
                  {ficha && (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={cancelarEdicao}
                      disabled={salvando}
                    >
                      <X data-icon="inline-start" />
                      Cancelar
                    </Button>
                  )}
                  <BotaoSalvar
                    formId={FORM}
                    alterado={alterado}
                    salvando={salvando}
                    className="hidden sm:inline-flex"
                  />
                </>
              )}
            </div>
          </div>
          <div className="-mt-2 flex flex-col gap-1 text-xs sm:flex-row sm:justify-between">
            {leitura ? (
              <span />
            ) : pendencias.length > 0 ? (
              <p className="text-amber-700">
                Preencha: {pendencias.join(", ")}.
              </p>
            ) : alterado ? (
              <p className="text-amber-700">
                {ficha
                  ? "Você tem alterações não salvas."
                  : "Pronto para salvar."}
              </p>
            ) : (
              <span />
            )}
            {ficha && (
              <p className="text-muted-foreground">
                Última edição: {ultimaEdicao(ficha.atualizadoEm)}
              </p>
            )}
          </div>
          {erroGeral && <Aviso tipo="erro">{erroGeral}</Aviso>}
        </div>
      </section>

      {/* Composição */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Package className="size-5 text-highlight-strong" />
            Composição
          </h2>
          <p className="text-sm text-muted-foreground">
            {leitura
              ? "Itens usados nesta ficha. Clique em Editar para alterar."
              : "Adicione os itens; o custo é recalculado na hora."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {info.composicao.map((secao) => {
            const s = SECOES[secao];
            const itens = resultado.itens
              .map((item, indice) => ({ item, indice }))
              .filter(({ item }) => item.tipo === secao);
            const r = ROTULO_ITEM[secao];
            return (
              <div
                key={secao}
                className="flex flex-col rounded-2xl bg-card ring-1 ring-foreground/10"
              >
                <div className="flex items-center gap-3 border-b p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <s.icone className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{s.titulo}</h3>
                    <p className="text-xs text-muted-foreground">
                      {itens.length} {itens.length === 1 ? "item" : "itens"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">
                      Custo
                    </p>
                    <p className="font-semibold tabular-nums">
                      {formatarMoeda(resultado.custos[secao])}
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  {itens.length ? (
                    <ul className="flex flex-col gap-1.5">
                      {itens.map(({ item, indice }) => (
                        <li
                          key={`${item.refId}-${indice}`}
                          className={cn(
                            "flex items-center gap-2 rounded-lg bg-muted/60 py-2 pr-1 pl-3",
                            !item.valido && "bg-highlight-soft",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setModal({ tipo: "item", item: secao, indice })
                            }
                            disabled={leitura}
                            className="min-w-0 flex-1 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
                            title={leitura ? undefined : "Alterar quantidade"}
                          >
                            <span className="block truncate text-sm font-medium">
                              {item.nome}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {item.detalhe}
                            </span>
                          </button>
                          <span className="shrink-0 text-sm tabular-nums">
                            {formatarMoedaPrecisa(item.custo)}
                          </span>
                          {!leitura && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removerItem(indice)}
                              aria-label={`Remover ${item.nome}`}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X />
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {s.vazio}
                    </p>
                  )}
                  {!leitura && (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-auto h-9 self-center"
                      onClick={() => setModal({ tipo: "item", item: secao })}
                    >
                      <CirclePlus data-icon="inline-start" />
                      Adicionar {r.singular}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Modo de preparo */}
          <div className="flex flex-col rounded-2xl bg-card ring-1 ring-foreground/10 md:col-span-2 xl:col-span-3">
            <div className="flex items-center gap-3 border-b p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <ListOrdered className="size-4" />
              </span>
              <div>
                <h3 className="font-semibold">Modo de preparo</h3>
                <p className="text-xs text-muted-foreground">
                  {estado.passos.length}{" "}
                  {estado.passos.length === 1 ? "etapa" : "etapas"}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 p-4">
              {estado.passos.length ? (
                <ol className="flex flex-col gap-2">
                  {estado.passos.map((passo, n) => (
                    <li
                      key={n}
                      className="flex items-start gap-3 rounded-lg bg-muted/60 p-3 text-sm"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {n + 1}
                      </span>
                      <span className="flex-1 pt-0.5 whitespace-pre-wrap">
                        {passo}
                      </span>
                      {!leitura && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            set(
                              "passos",
                              estado.passos.filter((_, i) => i !== n),
                            )
                          }
                          aria-label={`Remover passo ${n + 1}`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X />
                        </Button>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  Nenhum passo adicionado.
                </p>
              )}
              {!leitura && (
                <div className="flex gap-2">
                  <label htmlFor="novo-passo" className="sr-only">
                    Novo passo
                  </label>
                  <Input
                    id="novo-passo"
                    value={novoPasso}
                    onChange={(e) => setNovoPasso(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        adicionarPasso();
                      }
                    }}
                    maxLength={LIMITES.passo}
                    placeholder="Descreva o passo e tecle Enter..."
                    className="h-10 flex-1 scroll-mb-24 bg-muted/60"
                  />
                  <Button
                    type="button"
                    variant="highlight"
                    size="icon-lg"
                    className="size-10"
                    onClick={adicionarPasso}
                    aria-label="Adicionar passo"
                  >
                    <Plus />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Fichas que usam esta (como na referência: "Produtos que usam esta receita") */}
      {ficha && (tipo !== "produto" || props.usadoEm.length > 0) && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <ShoppingBag className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">
                {tipo === "produto"
                  ? "Produtos que usam este produto"
                  : "Produtos que usam esta receita"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {plural(usadoProdutos.length, "produto", "produtos")}
                {usadoReceitas.length > 0 &&
                  ` · ${plural(usadoReceitas.length, "receita", "receitas")}`}
                {totalVendas > 0 && (
                  <>
                    {" · "}Total em vendas:{" "}
                    <strong className="text-success tabular-nums">
                      {formatarMoeda(totalVendas)}
                    </strong>
                  </>
                )}
              </p>
            </div>
          </div>

          {props.usadoEm.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {props.usadoEm.map((u) => {
                const UIcone = INFO_TIPO[u.tipo].icone;
                return (
                  <li key={u.id}>
                    <Link
                      href={`${BASE}/ficha/${u.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-2 hover:ring-highlight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    >
                      <span className="relative flex h-16 items-center justify-center bg-gradient-to-br from-primary to-primary-strong text-primary-foreground/30">
                        <UIcone className="size-7" />
                        <span className="absolute top-2 right-2 rounded-md bg-highlight px-1.5 py-0.5 text-[11px] font-bold text-highlight-foreground tabular-nums">
                          {u.gramas.toLocaleString("pt-BR", {
                            maximumFractionDigits: 1,
                          })}
                          g
                        </span>
                      </span>
                      <span className="flex flex-1 flex-col gap-1 p-3">
                        <span
                          className="truncate text-sm font-semibold"
                          title={u.nome}
                        >
                          {u.nome}
                        </span>
                        <span className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
                          {u.tipo === "produto"
                            ? "Venda"
                            : INFO_TIPO[u.tipo].titulo.slice(0, -1)}
                          {u.tipo === "produto" && (
                            <strong className="text-sm text-success tabular-nums">
                              {u.preco != null ? formatarMoeda(u.preco) : "—"}
                            </strong>
                          )}
                        </span>
                        <span className="mt-auto flex items-center justify-center gap-1 pt-1 text-xs text-amber-700">
                          Ver ficha
                          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl bg-card px-4 py-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
              Nenhum produto usa esta receita ainda. Quando você adicionar esta
              receita a um produto, ele aparece aqui.
            </p>
          )}
        </section>
      )}

      {/* Celular: salvar fixo no rodapé */}
      {alterado && !leitura && (
        <>
          <div className="h-16 sm:hidden" aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 p-3 backdrop-blur sm:hidden">
            <Button
              type="submit"
              form={FORM}
              variant="highlight"
              size="lg"
              className="h-11 w-full"
              disabled={salvando}
            >
              {salvando ? (
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <Save data-icon="inline-start" />
              )}
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </>
      )}

      {modal?.tipo === "item" && (
        <ModalItem
          tipo={modal.item}
          opcoes={opcoesDe(modal.item)}
          atual={modal.indice != null ? estado.itens[modal.indice] : undefined}
          onFechar={() => setModal(null)}
          onConfirmar={(refId, quantidade) =>
            confirmarItem(modal.item, refId, quantidade, modal.indice)
          }
        />
      )}
      {modal?.tipo === "categoria" && (
        <ModalCategoriaFicha
          tipo={tipo}
          onFechar={() => setModal(null)}
          onConcluido={(titulo, descricao, criada) => {
            setModal(null);
            notificar.sucesso(titulo, descricao);
            if (criada) {
              setCategoriasCriadas((c) => [
                ...c,
                { ...criada, fichas: 0, tipo },
              ]);
              set("categoriaId", criada.id);
            }
          }}
        />
      )}
      {modal?.tipo === "excluir" && ficha && (
        <ModalExcluir
          item={info.singular}
          genero={tipo === "massa" ? "f" : "m"}
          nome={ficha.nome}
          consequencia={
            props.usadoEm.length
              ? `Ela também sai de ${props.usadoEm.length} ${props.usadoEm.length === 1 ? "ficha que a usa" : "fichas que a usam"}, e o custo delas muda.`
              : "Esta ação é irreversível."
          }
          detalhes={[
            {
              rotulo: "Custo total",
              valor: formatarMoeda(resultado.custoTotal),
            },
          ]}
          excluir={() => excluirFicha(ficha.id)}
          onFechar={() => setModal(null)}
          onConcluido={(titulo, descricao) => {
            setSalvo(JSON.stringify(estado)); // não avisar "alterações não salvas" ao sair
            notificar.sucesso(titulo, descricao);
            router.push(`${BASE}/${info.segmento}`);
          }}
        />
      )}
    </form>
  );
}

function CampoNumeroFicha({
  id,
  rotulo,
  icone: Icone,
  sufixo,
  valor,
  erro,
  dica,
  placeholder,
  pendente,
  leitura,
  onAlterar,
  children,
}: {
  id: string;
  rotulo: string;
  icone: LucideIcon;
  sufixo: string;
  valor: string;
  erro?: string;
  dica?: string;
  placeholder?: string;
  pendente?: boolean;
  /** Visualização: mostra o valor sem permitir digitar. */
  leitura?: boolean;
  onAlterar: (v: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        leitura
          ? "border-transparent bg-muted/60"
          : erro
            ? "border-destructive/60 bg-destructive/5"
            : pendente
              ? "border-destructive/40"
              : "border-highlight/50 bg-highlight-soft/30",
      )}
    >
      <label
        htmlFor={`ficha-${id}`}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
      >
        <Icone className="size-3.5" />
        {rotulo}
        {pendente && !leitura && (
          <span className="ml-auto rounded bg-destructive/10 px-1.5 py-px text-[10px] font-semibold text-destructive">
            Pendente
          </span>
        )}
      </label>
      <div className="mt-1 flex items-baseline gap-1.5">
        <input
          id={`ficha-${id}`}
          value={valor}
          onChange={(e) => onAlterar(e.target.value)}
          inputMode="decimal"
          placeholder={placeholder ?? "0"}
          aria-invalid={Boolean(erro)}
          readOnly={leitura}
          className={cn(
            "w-full min-w-0 scroll-mb-24 border-b bg-transparent py-0.5 text-xl font-bold tabular-nums outline-none placeholder:text-muted-foreground/50",
            leitura
              ? "border-transparent"
              : "border-border focus:border-highlight",
          )}
        />
        <span className="shrink-0 text-xs text-muted-foreground">{sufixo}</span>
      </div>
      {(erro || dica) && (
        <p
          className={cn(
            "mt-1 text-[11px]",
            erro ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {erro || dica}
        </p>
      )}
      {children}
    </div>
  );
}

function Numero({
  rotulo,
  valor,
  dica,
  destaque,
  children,
}: {
  rotulo: string;
  valor: string;
  dica?: string;
  destaque?: "sucesso";
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn("rounded-xl bg-muted/60 p-3", destaque && "bg-success/10")}
    >
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {rotulo}
        {children}
      </dt>
      <dd
        className={cn(
          "mt-0.5 text-lg font-bold tabular-nums",
          destaque && "text-success",
        )}
      >
        {valor}
      </dd>
      {dica && <p className="text-[11px] text-muted-foreground">{dica}</p>}
    </div>
  );
}

/** Data fixa no fuso de Brasília (igual no servidor e no navegador). */
function ultimaEdicao(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Selo({ rotulo, classe }: { rotulo: string; classe: string }) {
  return (
    <span
      className={cn("rounded px-1.5 py-px text-[10px] font-semibold", classe)}
    >
      {rotulo}
    </span>
  );
}
