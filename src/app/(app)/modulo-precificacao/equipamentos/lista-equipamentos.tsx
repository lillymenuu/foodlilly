"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  CircleCheck,
  CirclePlus,
  Cog,
  Flame,
  Pencil,
  Search,
  SearchX,
  Trash,
  Zap,
} from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ModalEquipamento, ModalExcluirEquipamento } from "./modais";
import { medida, type Equipamento } from "./tipos";

const ordens = {
  tipo: "Elétricos primeiro",
  "nome-asc": "Nome (A–Z)",
  "nome-desc": "Nome (Z–A)",
  recentes: "Mais recentes",
} as const;
type Ordem = keyof typeof ordens;

type Modal =
  | { tipo: "novo" }
  | { tipo: "editar"; equipamento: Equipamento }
  | { tipo: "excluir"; equipamento: Equipamento }
  | null;

/** Para buscar ignorando maiúsculas e acentos. */
const normalizar = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const comparaNome = (a: Equipamento, b: Equipamento) => a.nome.localeCompare(b.nome, "pt-BR");

function ordenar(lista: Equipamento[], ordem: Ordem) {
  const copia = [...lista];
  switch (ordem) {
    case "tipo":
      return copia.sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === "eletrico" ? -1 : 1));
    case "nome-asc":
      return copia.sort(comparaNome);
    case "nome-desc":
      return copia.sort((a, b) => comparaNome(b, a));
    case "recentes":
      return copia.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }
}

export function ListaEquipamentos({ equipamentos }: { equipamentos: Equipamento[] }) {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("tipo");
  const [modal, setModal] = useState<Modal>(null);
  const [mensagem, setMensagem] = useState<string>();

  const eletricos = equipamentos.filter((e) => e.tipo === "eletrico").length;
  const termo = normalizar(busca);
  const visiveis = ordenar(
    termo ? equipamentos.filter((e) => normalizar(e.nome).includes(termo)) : equipamentos,
    ordem,
  );

  function concluir(texto: string) {
    setModal(null);
    setMensagem(texto);
    setTimeout(() => setMensagem((atual) => (atual === texto ? undefined : atual)), 4000);
  }

  return (
    <>
      <section className="flex flex-col gap-5 rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
            <Cog className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Equipamentos</h1>
            <p className="mt-0.5 max-w-xl text-sm text-primary-foreground/75">
              Cadastre fornos, fogões e máquinas para calcular o custo de energia e gás das receitas.
            </p>
          </div>
        </div>

        <ul className="flex flex-wrap gap-2 text-xs font-medium">
          <li className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
            {equipamentos.length} {equipamentos.length === 1 ? "equipamento" : "equipamentos"}
          </li>
          <li className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
            <Zap className="size-3.5 text-highlight" /> {eletricos} {eletricos === 1 ? "elétrico" : "elétricos"}
          </li>
          <li className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
            <Flame className="size-3.5 text-highlight" /> {equipamentos.length - eletricos} a gás
          </li>
        </ul>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Buscar equipamento</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-primary-foreground/60" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar equipamento..."
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
                <DropdownMenuRadioGroup value={ordem} onValueChange={(v) => setOrdem(v as Ordem)}>
                  {(Object.keys(ordens) as Ordem[]).map((chave) => (
                    <DropdownMenuRadioItem key={chave} value={chave} closeOnClick>
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
              onClick={() => setModal({ tipo: "novo" })}
            >
              <CirclePlus data-icon="inline-start" />
              Novo
            </Button>
          </div>
        </div>
      </section>

      {mensagem && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm text-success"
        >
          <CircleCheck className="size-4 shrink-0" />
          {mensagem}
        </p>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <Cog className="size-4 text-highlight-strong" />
            Equipamentos cadastrados
          </h2>
          <span className="text-sm text-muted-foreground">
            {termo ? `${visiveis.length} de ${equipamentos.length}` : `${ordens[ordem]}`}
          </span>
        </div>

        {visiveis.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visiveis.map((e) => (
              <CardEquipamento
                key={e.id}
                equipamento={e}
                onEditar={() => setModal({ tipo: "editar", equipamento: e })}
                onExcluir={() => setModal({ tipo: "excluir", equipamento: e })}
              />
            ))}
          </ul>
        ) : (
          <Vazio
            busca={termo ? busca : undefined}
            onLimpar={() => setBusca("")}
            onNovo={() => setModal({ tipo: "novo" })}
          />
        )}
      </section>

      {modal?.tipo === "novo" && <ModalEquipamento onFechar={() => setModal(null)} onConcluido={concluir} />}
      {modal?.tipo === "editar" && (
        <ModalEquipamento
          key={modal.equipamento.id}
          equipamento={modal.equipamento}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
      {modal?.tipo === "excluir" && (
        <ModalExcluirEquipamento
          equipamento={modal.equipamento}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
    </>
  );
}

function CardEquipamento({
  equipamento: e,
  onEditar,
  onExcluir,
}: {
  equipamento: Equipamento;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const eletrico = e.tipo === "eletrico";
  const Icone = eletrico ? Zap : Flame;
  const { rotulo, valor } = medida(e);

  return (
    <li className="flex items-start gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-xl",
          eletrico ? "bg-primary text-primary-foreground" : "bg-highlight text-highlight-foreground",
        )}
      >
        <Icone className="size-6" />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold" title={e.nome}>
          {e.nome}
        </h3>
        <span
          className={cn(
            "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            eletrico ? "bg-primary-soft text-primary" : "bg-highlight-soft text-highlight-foreground",
          )}
        >
          <Icone className="size-3" />
          {eletrico ? "Elétrico" : "Gás"}
        </span>
        <p className="mt-2 text-sm text-muted-foreground">
          {rotulo}: <strong className="text-foreground tabular-nums">{valor}</strong>
        </p>
      </div>

      <div className="-mt-1 -mr-1 flex shrink-0">
        <Button variant="ghost" size="icon" onClick={onEditar} aria-label={`Editar ${e.nome}`} title="Editar">
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onExcluir}
          aria-label={`Excluir ${e.nome}`}
          title="Excluir"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash />
        </Button>
      </div>
    </li>
  );
}

function Vazio({
  busca,
  onLimpar,
  onNovo,
}: {
  busca?: string;
  onLimpar: () => void;
  onNovo: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
      <span className="flex size-12 items-center justify-center rounded-full bg-highlight-soft text-highlight-foreground">
        {busca ? <SearchX className="size-6" /> : <Cog className="size-6" />}
      </span>
      <p className="font-medium">
        {busca ? `Nenhum equipamento encontrado para "${busca}".` : "Nenhum equipamento cadastrado."}
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {busca
          ? "Confira a escrita ou limpe a busca para ver todos."
          : "Cadastre os equipamentos que você usa no preparo das receitas."}
      </p>
      {busca ? (
        <Button variant="outline" size="lg" onClick={onLimpar}>
          Limpar busca
        </Button>
      ) : (
        <Button variant="highlight" size="lg" onClick={onNovo}>
          <CirclePlus data-icon="inline-start" />
          Novo equipamento
        </Button>
      )}
    </div>
  );
}
