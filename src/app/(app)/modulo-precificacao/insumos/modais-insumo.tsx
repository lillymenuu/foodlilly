"use client";

import { useState, useTransition } from "react";
import { Lightbulb, LoaderCircle, Plus, ScanBarcode, Search } from "lucide-react";

import { CampoModal, ModalExcluir, ModalFormulario, semErro } from "@/components/cadastro";
import { SelectNativo } from "@/components/cadastro/select-nativo";
import { InputUnidade } from "@/components/formulario";
import { notificar } from "@/components/notificacoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatarMoeda, formatarPercentual, mascaraMoeda, paraNumero, paraTexto } from "@/lib/numero-br";

import { buscarCodigoBarras, criarInsumo, editarInsumo, excluirInsumo } from "./actions";
import { LeitorCodigo, leitorDisponivel } from "./leitor-codigo";
import { ModalCategoria } from "./modais-categoria";
import {
  custosUnitarios,
  formatarVolume,
  LIMITES,
  OPCOES_UNIDADE,
  volumeAproveitavel,
  type Categoria,
  type Insumo,
  type Unidade,
} from "./tipos";

const custoUnitario = (v: number, unidade: Unidade) =>
  `${v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4, maximumFractionDigits: 4 })}/${unidade === "unidade" ? "un." : unidade}`;

/** Cadastro (sem `insumo`) ou edição (com `insumo`). */
export function ModalInsumo({
  insumo,
  categorias,
  onFechar,
  onConcluido,
}: {
  insumo?: Insumo;
  categorias: Categoria[];
  onFechar: () => void;
  onConcluido: (titulo: string, descricao: string) => void;
}) {
  const [codigo, setCodigo] = useState(insumo?.codigoBarras ?? "");
  const [nome, setNome] = useState(insumo?.nome ?? "");
  const [categoriaId, setCategoriaId] = useState(insumo?.categoriaId ?? "");
  const [volume, setVolume] = useState(paraTexto(insumo?.volume));
  const [unidade, setUnidade] = useState<Unidade | "">(insumo?.unidade ?? "");
  const [custo, setCusto] = useState(paraTexto(insumo?.custo, 2));
  const [perda, setPerda] = useState(insumo?.perda ? paraTexto(insumo.perda) : "");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvando, startTransition] = useTransition();
  const [buscando, startBusca] = useTransition();
  const [lendo, setLendo] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState(false);
  // Categorias criadas aqui aparecem antes de a lista da página atualizar.
  const [criadas, setCriadas] = useState<Categoria[]>([]);

  const opcoesCategoria = [...categorias, ...criadas.filter((c) => !categorias.some((x) => x.id === c.id))].sort(
    (a, b) => a.nome.localeCompare(b.nome, "pt-BR"),
  );

  const alterar = (campo: string, set: (v: string) => void) => (v: string) => {
    set(v);
    setErros(semErro(campo));
  };

  function buscar(valor = codigo) {
    const limpo = valor.replace(/\D/g, "");
    if (!/^\d{8,14}$/.test(limpo)) {
      setErros((e) => ({ ...e, codigoBarras: "Digite um código de 8 a 14 números." }));
      return;
    }
    startBusca(async () => {
      const r = await buscarCodigoBarras(limpo);
      if (!r.ok) {
        notificar.info("Produto não encontrado", r.mensagem);
        return;
      }
      setNome(r.produto.nome);
      if (r.produto.volume) setVolume(paraTexto(r.produto.volume));
      if (r.produto.unidade) setUnidade(r.produto.unidade);
      setErros((e) => semErro("nome")(semErro("volume")(semErro("unidade")(e))));
      notificar.sucesso("Produto encontrado", "Confira os dados e informe o custo.");
    });
  }

  function iniciarLeitura() {
    if (!leitorDisponivel()) {
      notificar.info(
        "Leitura pela câmera indisponível",
        "Este navegador não lê códigos de barras. Digite o código e toque na lupa.",
      );
      return;
    }
    setLendo(true);
  }

  // Prévia do impacto da perda (só com volume, custo e unidade válidos).
  const nVolume = paraNumero(volume);
  const nCusto = paraNumero(custo);
  const nPerda = paraNumero(perda) ?? 0;
  const previa =
    unidade && nVolume && nCusto && !Number.isNaN(nVolume) && !Number.isNaN(nCusto) && !Number.isNaN(nPerda) && nPerda < 100
      ? (() => {
          const custos = custosUnitarios({ volume: nVolume, custo: nCusto, perda: nPerda });
          return {
            unidade,
            aproveitavel: volumeAproveitavel(nVolume, nPerda),
            ...custos,
            // Quanto o custo real ficou acima do custo sem perda (10% de perda = +11,1%).
            aumento: custos.semPerda > 0 ? custos.comPerda / custos.semPerda - 1 : 0,
          };
        })()
      : null;

  function enviar() {
    const e: Record<string, string> = {};
    const codigoLimpo = codigo.replace(/\D/g, "");
    if (codigoLimpo && !/^\d{8,14}$/.test(codigoLimpo)) e.codigoBarras = "O código deve ter de 8 a 14 números.";
    if (!nome.trim()) e.nome = "Informe o nome do insumo.";
    if (!categoriaId) e.categoriaId = "Escolha uma categoria.";
    if (nVolume == null || Number.isNaN(nVolume) || nVolume <= 0) e.volume = "Informe o volume.";
    if (!unidade) e.unidade = "Escolha a unidade.";
    if (!nCusto) e.custo = "Informe o custo.";
    if (Number.isNaN(nPerda)) e.perda = "Informe um número.";
    if (Object.keys(e).length || !unidade || !nVolume || !nCusto) {
      setErros(e);
      return;
    }

    const dados = {
      nome: nome.trim(),
      categoriaId,
      codigoBarras: codigoLimpo || null,
      volume: nVolume,
      unidade,
      custo: nCusto,
      perda: nPerda,
    };
    startTransition(async () => {
      const r = insumo ? await editarInsumo(insumo.id, dados) : await criarInsumo(dados);
      if (r.ok) onConcluido(insumo ? "Insumo atualizado" : "Insumo adicionado", dados.nome);
      else {
        setErros(r.erros ?? {});
        setErroGeral(r.mensagem);
      }
    });
  }

  return (
    <>
      <ModalFormulario
        editando={Boolean(insumo)}
        item="insumo"
        largo
        subtitulo={insumo?.nome}
        descricaoNovo="Cadastre uma matéria-prima, ingrediente ou embalagem."
        salvando={salvando}
        erroGeral={erroGeral}
        onFechar={onFechar}
        onEnviar={enviar}
      >
        <CampoModal
          id="insumo-codigo"
          rotulo="Código de barras"
          descricao="Opcional: leia ou digite o código da embalagem para preencher os dados."
          erro={erros.codigoBarras}
        >
          <div className="flex gap-2">
            <Input
              id="insumo-codigo"
              value={codigo}
              onChange={(e) => alterar("codigoBarras", setCodigo)(e.target.value.replace(/[^\d]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  buscar();
                }
              }}
              inputMode="numeric"
              placeholder="Ex.: 7891000100103"
              maxLength={14}
              autoComplete="off"
              aria-invalid={Boolean(erros.codigoBarras)}
              className="h-10 flex-1 bg-muted/60 tabular-nums"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="size-10"
              onClick={() => buscar()}
              disabled={buscando}
              aria-label="Buscar produto pelo código"
              title="Buscar produto"
            >
              {buscando ? <LoaderCircle className="animate-spin" /> : <Search />}
            </Button>
            <Button type="button" variant="highlight" size="lg" className="h-10" onClick={iniciarLeitura}>
              <ScanBarcode data-icon="inline-start" />
              Ler
            </Button>
          </div>
          {lendo && (
            <LeitorCodigo
              onFechar={() => setLendo(false)}
              onLido={(lido) => {
                setLendo(false);
                setCodigo(lido);
                buscar(lido);
              }}
            />
          )}
        </CampoModal>

        <CampoModal id="insumo-nome" rotulo="Nome do insumo *" erro={erros.nome}>
          <Input
            id="insumo-nome"
            value={nome}
            onChange={(e) => alterar("nome", setNome)(e.target.value)}
            placeholder="Ex.: Farinha de trigo"
            maxLength={LIMITES.nome}
            autoComplete="off"
            aria-invalid={Boolean(erros.nome)}
            className="h-10 bg-muted/60"
          />
        </CampoModal>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="insumo-categoria" className="text-sm font-medium">
              Categoria *
            </label>
            <button
              type="button"
              onClick={() => setNovaCategoria(true)}
              className="flex items-center gap-1 rounded text-xs font-semibold text-amber-700 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Plus className="size-3.5" />
              Nova categoria
            </button>
          </div>
          <SelectNativo
            id="insumo-categoria"
            value={categoriaId}
            onChange={(e) => alterar("categoriaId", setCategoriaId)(e.target.value)}
            aria-invalid={Boolean(erros.categoriaId)}
          >
            <option value="" disabled>
              Selecione uma categoria
            </option>
            {opcoesCategoria.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </SelectNativo>
          {erros.categoriaId && <p className="text-xs text-destructive">{erros.categoriaId}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CampoModal id="insumo-volume" rotulo="Volume bruto *" erro={erros.volume}>
            <Input
              id="insumo-volume"
              value={volume}
              onChange={(e) => alterar("volume", setVolume)(e.target.value)}
              inputMode="decimal"
              placeholder="Ex.: 1000"
              autoComplete="off"
              aria-invalid={Boolean(erros.volume)}
              className="h-10 bg-muted/60 tabular-nums"
            />
          </CampoModal>
          <CampoModal id="insumo-unidade" rotulo="Unidade *" erro={erros.unidade}>
            <SelectNativo
              id="insumo-unidade"
              value={unidade}
              onChange={(e) => alterar("unidade", (v) => setUnidade(v as Unidade))(e.target.value)}
              aria-invalid={Boolean(erros.unidade)}
            >
              <option value="" disabled>
                Selecione
              </option>
              {OPCOES_UNIDADE.map((u) => (
                <option key={u.valor} value={u.valor}>
                  {u.rotulo}
                </option>
              ))}
            </SelectNativo>
          </CampoModal>
        </div>

        <CampoModal
          id="insumo-custo"
          rotulo="Custo médio *"
          descricao="Quanto você paga pelo volume bruto informado acima."
          erro={erros.custo}
        >
          <InputUnidade
            id="insumo-custo"
            prefixo="R$"
            inputMode="numeric"
            value={custo}
            onChange={(e) => alterar("custo", setCusto)(mascaraMoeda(e.target.value))}
            placeholder="0,00"
            aria-invalid={Boolean(erros.custo)}
          />
        </CampoModal>

        <CampoModal
          id="insumo-perda"
          rotulo="Fator de perda (%)"
          descricao="Opcional: o que se perde no preparo (cascas, aparas, evaporação)."
          erro={erros.perda}
        >
          <InputUnidade
            id="insumo-perda"
            sufixo="%"
            inputMode="decimal"
            value={perda}
            onChange={(e) => alterar("perda", setPerda)(e.target.value)}
            placeholder="0"
            aria-invalid={Boolean(erros.perda)}
          />
        </CampoModal>

        {previa && (
          <div className="rounded-xl border border-primary/15 bg-primary-soft/50 p-4 text-sm">
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-primary">
              <Lightbulb className="size-4" />
              Impacto do fator de perda
            </p>
            <dl className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Volume aproveitável</dt>
                <dd className="font-medium tabular-nums">{formatarVolume(previa.aproveitavel, previa.unidade)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Custo sem perda</dt>
                <dd className={`tabular-nums ${nPerda > 0 ? "text-muted-foreground line-through" : "font-medium"}`}>
                  {custoUnitario(previa.semPerda, previa.unidade)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Custo real (com perda)</dt>
                <dd className="font-semibold text-success tabular-nums">
                  {custoUnitario(previa.comPerda, previa.unidade)}
                </dd>
              </div>
              <div className="mt-1 flex justify-between gap-4 border-t border-primary/15 pt-2">
                <dt className="text-muted-foreground">Aumento no custo</dt>
                <dd className={`font-semibold tabular-nums ${previa.aumento > 0 ? "text-amber-700" : "text-muted-foreground"}`}>
                  {formatarPercentual(previa.aumento, 1, true)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </ModalFormulario>

      {novaCategoria && (
        <ModalCategoria
          onFechar={() => setNovaCategoria(false)}
          onConcluido={(titulo, descricao, criada) => {
            setNovaCategoria(false);
            notificar.sucesso(titulo, descricao);
            if (criada) {
              setCriadas((c) => [...c, { ...criada, sistema: false, insumos: 0 }]);
              setCategoriaId(criada.id);
              setErros(semErro("categoriaId"));
            }
          }}
        />
      )}
    </>
  );
}

export function ModalExcluirInsumo({
  insumo,
  categoria,
  onFechar,
  onConcluido,
}: {
  insumo: Insumo;
  categoria?: string;
  onFechar: () => void;
  onConcluido: (titulo: string, descricao: string) => void;
}) {
  return (
    <ModalExcluir
      item="insumo"
      nome={insumo.nome}
      consequencia="Esta ação é irreversível e o insumo será removido permanentemente."
      detalhes={[
        { rotulo: "Categoria", valor: categoria ?? "—" },
        { rotulo: "Volume", valor: formatarVolume(insumo.volume, insumo.unidade) },
        { rotulo: "Custo médio", valor: formatarMoeda(insumo.custo) },
      ]}
      excluir={() => excluirInsumo(insumo.id)}
      onFechar={onFechar}
      onConcluido={onConcluido}
    />
  );
}
