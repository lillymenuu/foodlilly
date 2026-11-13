"use client";

import { useLayoutEffect, useState, useTransition } from "react";
import {
  Eye,
  FileText,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  StickyNote,
  Trash,
  Users,
} from "lucide-react";

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
import { mascaraDocumento, mascaraTelefone } from "@/lib/cadastro";
import { iniciais, normalizar, plural } from "@/lib/texto";

import {
  criarFornecedor,
  editarFornecedor,
  excluirFornecedor,
  type DadosFornecedor,
} from "./acoes-fornecedores";
import type { Fornecedor } from "./tipos";

type Modal =
  | { tipo: "novo" }
  | { tipo: "editar"; f: Fornecedor }
  | { tipo: "ver"; f: Fornecedor }
  | { tipo: "excluir"; f: Fornecedor }
  | null;

const fone = (t: string | null) => (t ? mascaraTelefone(t, "BR") : "");
const doc = (d: string | null) => (d ? mascaraDocumento(d) : "");
const tipoDoc = (d: string | null) =>
  d ? (d.length === 11 ? "CPF" : "CNPJ") : "";

export function PainelFornecedores({
  fornecedores,
}: {
  fornecedores: Fornecedor[];
}) {
  const [modal, setModal] = useState<Modal>(null);
  const [busca, setBusca] = useState("");
  useLayoutEffect(() => () => setModal(null), []);

  const termo = normalizar(busca);
  const digitos = busca.replace(/\D/g, "");
  const visiveis = fornecedores.filter(
    (f) =>
      !termo ||
      normalizar(`${f.nome} ${f.email ?? ""} ${f.observacoes ?? ""}`).includes(
        termo,
      ) ||
      (digitos.length >= 3 &&
        `${f.telefone ?? ""} ${f.documento ?? ""}`.includes(digitos)),
  );
  const concluir = (titulo: string, descricao: string) => {
    setModal(null);
    notificar.sucesso(titulo, descricao);
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="forn-busca" className="sr-only">
            Buscar fornecedor
          </label>
          <Input
            id="forn-busca"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nome, telefone, e-mail, CNPJ..."
            className="h-10 bg-card pl-9"
          />
        </div>
        <Button
          variant="highlight"
          size="lg"
          className="h-10"
          onClick={() => setModal({ tipo: "novo" })}
        >
          <Plus data-icon="inline-start" />
          Novo fornecedor
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Users className="size-5" />
        </span>
        <div>
          <h2 className="font-semibold">Fornecedores</h2>
          <p className="text-sm text-muted-foreground">
            {termo && visiveis.length !== fornecedores.length
              ? `${visiveis.length} de `
              : ""}
            {plural(fornecedores.length, "cadastrado", "cadastrados")}
          </p>
        </div>
      </div>

      {visiveis.length ? (
        <ul className="flex flex-col gap-2">
          {visiveis.map((f, i) => (
            <li
              key={f.id}
              className="group flex items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-md hover:ring-highlight/50 animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
              style={{
                animationDelay: `${Math.min(i, 10) * 40}ms`,
                animationFillMode: "both",
              }}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                {iniciais(f.nome)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{f.nome}</p>
                <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {f.telefone && (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3.5" />
                      {fone(f.telefone)}
                    </span>
                  )}
                  {f.email && (
                    <span className="flex min-w-0 items-center gap-1">
                      <Mail className="size-3.5 shrink-0" />
                      <span className="truncate">{f.email}</span>
                    </span>
                  )}
                  {f.documento && (
                    <span className="flex items-center gap-1">
                      <FileText className="size-3.5" />
                      {tipoDoc(f.documento)} {doc(f.documento)}
                    </span>
                  )}
                </p>
                {f.observacoes && (
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/80">
                    {f.observacoes}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setModal({ tipo: "ver", f })}
                  aria-label={`Ver ${f.nome}`}
                  title="Ver detalhes"
                  className="text-muted-foreground"
                >
                  <Eye />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setModal({ tipo: "editar", f })}
                  aria-label={`Editar ${f.nome}`}
                  title="Editar"
                  className="text-muted-foreground"
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setModal({ tipo: "excluir", f })}
                  aria-label={`Excluir ${f.nome}`}
                  title="Excluir"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-5 py-12 text-center ring-1 ring-foreground/10">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Users className="size-6" />
          </span>
          <p className="font-medium">
            {termo
              ? "Nenhum fornecedor encontrado"
              : "Nenhum fornecedor cadastrado"}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {termo
              ? "Tente buscar por outro nome, e-mail ou telefone."
              : "Cadastre fornecedores e clientes para usar nos gastos e recebimentos."}
          </p>
          {!termo && (
            <Button
              variant="highlight"
              onClick={() => setModal({ tipo: "novo" })}
            >
              <Plus data-icon="inline-start" />
              Novo fornecedor
            </Button>
          )}
        </div>
      )}

      {(modal?.tipo === "novo" || modal?.tipo === "editar") && (
        <ModalFornecedor
          key={modal.tipo === "editar" ? modal.f.id : "novo"}
          fornecedor={modal.tipo === "editar" ? modal.f : undefined}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
      {modal?.tipo === "ver" && (
        <ModalVer
          f={modal.f}
          onEditar={() => setModal({ tipo: "editar", f: modal.f })}
          onFechar={() => setModal(null)}
        />
      )}
      {modal?.tipo === "excluir" && (
        <ModalExcluir
          item="fornecedor"
          nome={modal.f.nome}
          consequencia="O fornecedor será removido do Financeiro."
          detalhes={[
            ...(modal.f.telefone
              ? [{ rotulo: "Telefone", valor: fone(modal.f.telefone) }]
              : []),
            ...(modal.f.documento
              ? [
                  {
                    rotulo: tipoDoc(modal.f.documento),
                    valor: doc(modal.f.documento),
                  },
                ]
              : []),
          ]}
          excluir={() => excluirFornecedor(modal.f.id)}
          onFechar={() => setModal(null)}
          onConcluido={concluir}
        />
      )}
    </section>
  );
}

function ModalFornecedor({
  fornecedor,
  onFechar,
  onConcluido,
}: {
  fornecedor?: Fornecedor;
  onFechar: () => void;
  onConcluido: (t: string, d: string) => void;
}) {
  const [d, setD] = useState<DadosFornecedor>({
    nome: fornecedor?.nome ?? "",
    telefone: fone(fornecedor?.telefone ?? null),
    documento: doc(fornecedor?.documento ?? null),
    email: fornecedor?.email ?? "",
    observacoes: fornecedor?.observacoes ?? "",
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvando, start] = useTransition();
  const set = (k: keyof DadosFornecedor, v: string) => {
    setD((a) => ({ ...a, [k]: v }));
    setErros(semErro(k));
  };
  const docLimpo = d.documento.replace(/[^0-9A-Za-z]/g, "");
  return (
    <ModalFormulario
      editando={Boolean(fornecedor)}
      item="fornecedor"
      subtitulo={fornecedor?.nome}
      descricaoNovo="Cadastre um fornecedor ou cliente do negócio."
      salvando={salvando}
      erroGeral={erroGeral}
      onFechar={onFechar}
      onEnviar={() => {
        if (!d.nome.trim()) return setErros({ nome: "Informe o nome." });
        start(async () => {
          const r = fornecedor
            ? await editarFornecedor(fornecedor.id, d)
            : await criarFornecedor(d);
          if (r.ok)
            onConcluido(
              fornecedor ? "Fornecedor atualizado" : "Fornecedor cadastrado",
              d.nome.trim(),
            );
          else {
            setErros(r.erros ?? {});
            setErroGeral(r.erros ? undefined : r.mensagem);
          }
        });
      }}
    >
      <CampoModal id="forn-nome" rotulo="Nome" erro={erros.nome}>
        <Input
          id="forn-nome"
          value={d.nome}
          maxLength={100}
          autoFocus={!fornecedor}
          placeholder="Ex.: Distribuidora São José, João da Silva"
          onChange={(e) => set("nome", e.target.value)}
          className="h-10 bg-muted/60"
        />
      </CampoModal>
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoModal id="forn-telefone" rotulo="Telefone" erro={erros.telefone}>
          <Input
            id="forn-telefone"
            type="tel"
            inputMode="tel"
            value={d.telefone}
            placeholder="(00) 00000-0000"
            onChange={(e) =>
              set("telefone", mascaraTelefone(e.target.value, "BR"))
            }
            className="h-10 bg-muted/60"
          />
        </CampoModal>
        <CampoModal
          id="forn-documento"
          rotulo={
            docLimpo.length > 11 || /[a-z]/i.test(docLimpo)
              ? "CNPJ"
              : "CPF ou CNPJ"
          }
          erro={erros.documento}
        >
          <Input
            id="forn-documento"
            value={d.documento}
            placeholder="000.000.000-00"
            onChange={(e) => set("documento", mascaraDocumento(e.target.value))}
            className="h-10 bg-muted/60 uppercase"
          />
        </CampoModal>
      </div>
      <CampoModal id="forn-email" rotulo="E-mail" erro={erros.email}>
        <Input
          id="forn-email"
          type="email"
          inputMode="email"
          value={d.email}
          placeholder="contato@fornecedor.com"
          onChange={(e) => set("email", e.target.value)}
          className="h-10 bg-muted/60"
        />
      </CampoModal>
      <CampoModal
        id="forn-observacoes"
        rotulo="Observações"
        descricao="Prazo de entrega, condição de pagamento, contato…"
        erro={erros.observacoes}
      >
        <textarea
          id="forn-observacoes"
          value={d.observacoes}
          maxLength={500}
          rows={3}
          placeholder="Informações adicionais sobre o fornecedor"
          onChange={(e) => set("observacoes", e.target.value)}
          className="w-full resize-none rounded-lg border border-input bg-muted/60 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </CampoModal>
    </ModalFormulario>
  );
}

function ModalVer({
  f,
  onEditar,
  onFechar,
}: {
  f: Fornecedor;
  onEditar: () => void;
  onFechar: () => void;
}) {
  const zap = f.telefone ? `https://wa.me/55${f.telefone}` : null;
  const linhas = [
    { icone: Phone, rotulo: "Telefone", valor: fone(f.telefone) },
    { icone: Mail, rotulo: "E-mail", valor: f.email ?? "" },
    {
      icone: FileText,
      rotulo: tipoDoc(f.documento) || "CPF/CNPJ",
      valor: doc(f.documento),
    },
    { icone: StickyNote, rotulo: "Observações", valor: f.observacoes ?? "" },
  ];
  return (
    <Dialog open onOpenChange={(a) => !a && onFechar()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <ModalCabecalho
          tipo="editar"
          icone={Users}
          titulo={f.nome}
          descricao="Fornecedor"
        />
        <dl className="flex flex-col divide-y px-5 sm:px-6">
          {linhas.map((l) => (
            <div key={l.rotulo} className="flex items-start gap-3 py-3">
              <l.icone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <dt className="w-24 shrink-0 text-sm text-muted-foreground">
                {l.rotulo}
              </dt>
              <dd className="min-w-0 flex-1 text-sm break-words whitespace-pre-line">
                {l.valor || (
                  <span className="text-muted-foreground">Não informado</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col-reverse gap-2 border-t bg-muted px-5 py-4 sm:flex-row sm:px-6">
          <DialogClose
            render={
              <Button variant="outline" size="lg" className="h-11 sm:flex-1" />
            }
          >
            Fechar
          </DialogClose>
          {zap && (
            <Button
              variant="outline"
              size="lg"
              className="h-11 sm:flex-1"
              render={
                <a href={zap} target="_blank" rel="noopener noreferrer" />
              }
            >
              <MessageCircle data-icon="inline-start" />
              WhatsApp
            </Button>
          )}
          <Button size="lg" className="h-11 sm:flex-1" onClick={onEditar}>
            <Pencil data-icon="inline-start" />
            Editar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
