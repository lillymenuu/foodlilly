"use client";

import { useState, useTransition } from "react";
import {
  ArrowUpDown,
  CirclePlus,
  LoaderCircle,
  Pencil,
  Search,
  SearchX,
  Trash,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { Aviso } from "@/components/formulario";
import { ModalCabecalho } from "@/components/modal-cabecalho";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import type { ResultadoSalvar } from "@/lib/validacao";

/** Gênero gramatical do item, para os textos ("novo funcionário" / "nova categoria"). */
export type Genero = "m" | "f";
const artigos = (g: Genero = "m") =>
  g === "f"
    ? { novo: "nova", o: "a", do: "da", excluido: "excluída" }
    : { novo: "novo", o: "o", do: "do", excluido: "excluído" };
const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/*
 * Peças das telas de cadastro (lista + criar/editar/excluir).
 * Referência de uso: modulo-precificacao/equipamentos e /funcionarios.
 */

export function BannerCadastro<O extends string>({
  titulo,
  descricao,
  icone: Icone,
  resumo,
  busca,
  onBusca,
  placeholderBusca,
  ordens,
  ordem,
  onOrdem,
  onNovo,
  abas,
  semFerramentas,
}: {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  /** Selos com números do cadastro (ex.: "9 equipamentos"). */
  resumo?: { texto: React.ReactNode; icone?: LucideIcon }[];
  /** Abas abaixo do título (ex.: Insumos | Categorias). */
  abas?: React.ReactNode;
  /** Esconde busca, ordenar e novo (ex.: numa aba sem lista). */
  semFerramentas?: boolean;
  busca: string;
  onBusca: (busca: string) => void;
  placeholderBusca: string;
  ordens: Record<O, string>;
  ordem: O;
  onOrdem: (ordem: O) => void;
  onNovo: () => void;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
          <Icone className="size-6" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {titulo}
          </h1>
          <p className="mt-0.5 max-w-xl text-sm text-primary-foreground/75">
            {descricao}
          </p>
        </div>
      </div>

      {abas}

      {resumo && (
        <ul className="flex flex-wrap gap-2 text-xs font-medium">
          {resumo.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15"
            >
              {item.icone && <item.icone className="size-3.5 text-highlight" />}
              {item.texto}
            </li>
          ))}
        </ul>
      )}

      {!semFerramentas && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">{placeholderBusca}</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-primary-foreground/60" />
            <input
              type="search"
              value={busca}
              onChange={(e) => onBusca(e.target.value)}
              placeholder={placeholderBusca}
              className="h-11 w-full rounded-lg bg-white/10 pr-3 pl-9 text-sm ring-1 ring-white/15 outline-none placeholder:text-primary-foreground/60 focus-visible:ring-2 focus-visible:ring-highlight"
            />
          </label>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-11 flex-1 border-white/15 bg-white/10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground sm:flex-none"
                  />
                }
              >
                <ArrowUpDown data-icon="inline-start" />
                Ordenar
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuRadioGroup
                  value={ordem}
                  onValueChange={(v) => onOrdem(v as O)}
                >
                  {(Object.keys(ordens) as O[]).map((chave) => (
                    <DropdownMenuRadioItem
                      key={chave}
                      value={chave}
                      closeOnClick
                    >
                      {ordens[chave]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="highlight"
              size="lg"
              className="h-11 flex-1 px-5 sm:flex-none"
              onClick={onNovo}
            >
              <CirclePlus data-icon="inline-start" />
              Novo
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

export function CabecalhoLista({
  icone: Icone,
  titulo,
  info,
}: {
  icone: LucideIcon;
  titulo: string;
  info: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-semibold">
        <Icone className="size-4 text-highlight-strong" />
        {titulo}
      </h2>
      <span className="text-sm text-muted-foreground">{info}</span>
    </div>
  );
}

export function GradeCadastro({ children }: { children: React.ReactNode }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</ul>
  );
}

/** Card de um item: avatar/ícone à esquerda, conteúdo, e botões editar/excluir. */
export function CardCadastro({
  avatar,
  titulo,
  children,
  onEditar,
  onExcluir,
}: {
  avatar: React.ReactNode;
  titulo: string;
  children: React.ReactNode;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  return (
    <li className="flex items-start gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
      {avatar}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold" title={titulo}>
          {titulo}
        </h3>
        {children}
      </div>
      <div className="-mt-1 -mr-1 flex shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEditar}
          aria-label={`Editar ${titulo}`}
          title="Editar"
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onExcluir}
          aria-label={`Excluir ${titulo}`}
          title="Excluir"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash />
        </Button>
      </div>
    </li>
  );
}

export function VazioCadastro({
  icone: Icone,
  busca,
  textoVazio,
  dicaVazia,
  rotuloNovo,
  onLimpar,
  onNovo,
}: {
  icone: LucideIcon;
  /** Preenchido quando a lista está vazia por causa da busca. */
  busca?: string;
  textoVazio: string;
  dicaVazia: string;
  rotuloNovo: string;
  onLimpar: () => void;
  onNovo: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
      <span className="flex size-12 items-center justify-center rounded-full bg-highlight-soft text-highlight-foreground">
        {busca ? <SearchX className="size-6" /> : <Icone className="size-6" />}
      </span>
      <p className="font-medium">
        {busca ? `Nada encontrado para "${busca}".` : textoVazio}
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {busca
          ? "Confira a escrita ou limpe a busca para ver todos."
          : dicaVazia}
      </p>
      {busca ? (
        <Button variant="outline" size="lg" onClick={onLimpar}>
          Limpar busca
        </Button>
      ) : (
        <Button variant="highlight" size="lg" onClick={onNovo}>
          <CirclePlus data-icon="inline-start" />
          {rotuloNovo}
        </Button>
      )}
    </div>
  );
}

/** Remove o erro de um campo: `setErros(semErro("nome"))`. */
export const semErro = (chave: string) => (erros: Record<string, string>) => {
  if (!(chave in erros)) return erros;
  const resto = { ...erros };
  delete resto[chave];
  return resto;
};

/** Campo de formulário de modal: rótulo, descrição curta, controle e erro. */
export function CampoModal({
  id,
  rotulo,
  descricao,
  erro,
  children,
}: {
  id: string;
  rotulo: string;
  descricao?: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      {descricao && (
        <p className="text-xs text-muted-foreground">{descricao}</p>
      )}
      {children}
      {erro && (
        <p id={`${id}-erro`} className="text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Modal de cadastro/edição: cabeçalho colorido, formulário e botões. */
export function ModalFormulario({
  editando,
  item,
  genero,
  subtitulo,
  largo,
  descricaoNovo,
  salvando,
  erroGeral,
  onFechar,
  onEnviar,
  children,
}: {
  editando: boolean;
  /** Nome do tipo de item, minúsculo: "equipamento", "funcionário". */
  item: string;
  genero?: Genero;
  /** Substitui a descrição do cabeçalho ao editar (ex.: o nome do item). */
  subtitulo?: string;
  /** Modal mais largo, para formulários com mais campos. */
  largo?: boolean;
  descricaoNovo: string;
  salvando: boolean;
  erroGeral?: string;
  onFechar: () => void;
  onEnviar: () => void;
  children: React.ReactNode;
}) {
  const a = artigos(genero);
  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent
        showCloseButton={false}
        className={`max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 ${largo ? "sm:max-w-lg" : "sm:max-w-md"}`}
      >
        <ModalCabecalho
          tipo={editando ? "editar" : "novo"}
          icone={editando ? Pencil : CirclePlus}
          titulo={editando ? `Editar ${item}` : `Adicionar ${a.novo} ${item}`}
          descricao={
            editando
              ? (subtitulo ?? `Atualize as informações ${a.do} ${item}.`)
              : descricaoNovo
          }
        />
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            // Modal aberto dentro de outro (ex.: nova categoria no insumo): sem isto,
            // o envio "sobe" pela árvore do React e também envia o formulário de fora.
            e.stopPropagation();
            if (!salvando) onEnviar();
          }}
        >
          <div className="flex flex-col gap-5 p-5 sm:p-6">
            {erroGeral && <Aviso tipo="erro">{erroGeral}</Aviso>}
            {children}
          </div>
          {/* Fixo no rodapé: em formulários longos (celular) o botão fica sempre visível. */}
          <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t bg-muted px-5 py-4 sm:flex-row sm:px-6">
            {editando && (
              <DialogClose
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-11 sm:flex-1"
                  />
                }
              >
                Cancelar
              </DialogClose>
            )}
            <Button
              type="submit"
              size="lg"
              variant={editando ? "default" : "highlight"}
              disabled={salvando}
              className="h-11 sm:flex-1"
            >
              {salvando ? (
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : editando ? null : (
                <CirclePlus data-icon="inline-start" />
              )}
              {salvando
                ? "Salvando..."
                : editando
                  ? "Confirmar alterações"
                  : `Adicionar ${item}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Modal de confirmação de exclusão. */
export function ModalExcluir({
  item,
  genero,
  children,
  desabilitado,
  nome,
  consequencia,
  detalhes,
  excluir,
  onFechar,
  onConcluido,
}: {
  /** Nome do tipo de item, minúsculo: "equipamento", "funcionário". */
  item: string;
  genero?: Genero;
  /** Conteúdo extra (ex.: escolher para onde mover itens). */
  children?: React.ReactNode;
  /** Impede confirmar (ex.: falta escolher o destino). */
  desabilitado?: boolean;
  nome: string;
  consequencia: string;
  detalhes: { rotulo: string; valor: string }[];
  excluir: () => Promise<ResultadoSalvar>;
  onFechar: () => void;
  onConcluido: (titulo: string, descricao: string) => void;
}) {
  const [erro, setErro] = useState<string>();
  const [excluindo, startTransition] = useTransition();
  const a = artigos(genero);

  function confirmar() {
    startTransition(async () => {
      const resultado = await excluir();
      if (resultado.ok) onConcluido(`${maiuscula(item)} ${a.excluido}`, nome);
      else setErro(resultado.mensagem);
    });
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <ModalCabecalho
          tipo="excluir"
          icone={Trash}
          titulo="Confirmar exclusão"
          descricao="Esta ação não pode ser desfeita."
        />
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="flex flex-col gap-1.5">
              <p className="font-semibold text-destructive">Atenção!</p>
              <p>
                Você está prestes a excluir {a.o} {item} <strong>{nome}</strong>
                .
              </p>
              <p className="text-muted-foreground">{consequencia}</p>
            </div>
          </div>
          <dl className="flex flex-col gap-2 rounded-xl border p-4 text-sm">
            {[{ rotulo: "Nome", valor: nome }, ...detalhes].map((d) => (
              <div key={d.rotulo} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{d.rotulo}</dt>
                <dd className="text-right font-medium tabular-nums">
                  {d.valor}
                </dd>
              </div>
            ))}
          </dl>
          {children}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t bg-muted/50 px-5 py-4 sm:flex-row sm:px-6">
          <DialogClose
            render={
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 sm:flex-1"
              />
            }
          >
            Cancelar
          </DialogClose>
          <Button
            type="button"
            size="lg"
            disabled={excluindo || desabilitado}
            onClick={confirmar}
            className="h-11 sm:flex-1 bg-destructive text-white hover:bg-destructive/90"
          >
            {excluindo && (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            )}
            {excluindo ? "Excluindo..." : "Confirmar exclusão"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
