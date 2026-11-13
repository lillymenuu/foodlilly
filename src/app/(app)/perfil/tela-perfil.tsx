"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  IdCard,
  KeyRound,
  Lock,
  Mail,
  Save,
  Store,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import { CampoAcesso, CampoSenha } from "@/components/acesso";
import { Bandeira } from "@/components/bandeira";
import { notificar } from "@/components/notificacoes";
import { Button } from "@/components/ui/button";
import {
  mascaraCpf,
  mascaraTelefone,
  PAISES,
  paisPorCodigo,
} from "@/lib/cadastro";
import { iniciais } from "@/lib/texto";

import { authClient } from "@/lib/auth-client";
import { SENHA_MINIMA } from "@/lib/cadastro";

import { criarSenha, salvarDadosPessoais, salvarNegocio } from "./actions";

type ResultadoSenha =
  | { ok: true }
  | { ok: false; mensagem: string; erros?: Record<string, string> };

async function trocarSenhaNoCliente(d: {
  atual: string;
  nova: string;
  confirmar: string;
}): Promise<ResultadoSenha> {
  const erros: Record<string, string> = {};
  if (!d.atual) erros.atual = "Informe a senha atual.";
  if (d.nova.length < SENHA_MINIMA)
    erros.nova = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  else if (d.nova.length > 128) erros.nova = "Senha muito longa.";
  if (d.confirmar !== d.nova) erros.confirmar = "As senhas não são iguais.";
  if (Object.keys(erros).length)
    return { ok: false, mensagem: "Confira os campos destacados.", erros };
  const { error } = await authClient.changePassword({
    currentPassword: d.atual,
    newPassword: d.nova,
    revokeOtherSessions: true,
  });
  if (!error) return { ok: true };
  if (error.code === "INVALID_PASSWORD")
    return {
      ok: false,
      mensagem: "Senha atual incorreta.",
      erros: { atual: "Senha atual incorreta." },
    };
  return { ok: false, mensagem: "Não foi possível alterar a senha agora." };
}

type Props = {
  usuario: {
    nome: string;
    email: string;
    pais: string;
    telefone: string;
    cpf: string;
    criadoEm: string;
  };
  negocio: { nome: string };
  temSenha: boolean;
  temGoogle: boolean;
  acesso: {
    situacao: "isento" | "pago" | "teste" | "expirado";
    ate: string | null;
    dias: number | null;
    plano: string;
  };
};

const data = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

export function TelaPerfil({
  usuario,
  negocio,
  temSenha,
  temGoogle,
  acesso,
}: Props) {
  return (
    <>
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-strong p-5 text-primary-foreground sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-highlight/15 blur-2xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-highlight text-xl font-bold text-highlight-foreground shadow-lg shadow-black/20">
            {iniciais(usuario.nome)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {usuario.nome}
            </h1>
            <p className="truncate text-sm text-primary-foreground/75">
              {usuario.email}
            </p>
            <p className="mt-1 text-xs text-primary-foreground/60">
              Cliente desde {data(usuario.criadoEm)}
            </p>
          </div>
          <SeloAcesso acesso={acesso} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <DadosPessoais usuario={usuario} />
        <div className="flex flex-col gap-4">
          <DadosNegocio negocio={negocio} />
          <Senha temSenha={temSenha} temGoogle={temGoogle} />
        </div>
      </div>
    </>
  );
}

function SeloAcesso({ acesso }: { acesso: Props["acesso"] }) {
  const texto =
    acesso.situacao === "isento"
      ? "Acesso liberado"
      : acesso.situacao === "pago"
        ? `${acesso.plano} · até ${acesso.ate ? data(acesso.ate) : ""}`
        : acesso.situacao === "teste"
          ? `Teste grátis · ${acesso.dias === 1 ? "último dia" : `${acesso.dias} dias restantes`}`
          : "Acesso vencido";
  return (
    <Link
      href="/assinatura"
      className={cn(
        "group flex items-center gap-2 self-start rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition-colors sm:self-center",
        acesso.situacao === "expirado"
          ? "bg-destructive text-white ring-destructive"
          : "bg-white/10 ring-white/20 hover:bg-white/15",
      )}
    >
      {acesso.situacao === "teste" ? (
        <CalendarClock className="size-4 text-highlight" />
      ) : (
        <BadgeCheck className="size-4 text-highlight" />
      )}
      {texto}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function Cartao({
  icone: Icone,
  titulo,
  descricao,
  children,
}: {
  icone: LucideIcon;
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
      <header className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icone className="size-5" />
        </span>
        <div>
          <h2 className="font-semibold">{titulo}</h2>
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function BotaoSalvar({
  salvando,
  alterado,
  children = "Salvar alterações",
}: {
  salvando: boolean;
  alterado: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Button
      type="submit"
      size="lg"
      className="h-10 self-end"
      disabled={!alterado || salvando}
    >
      <Save data-icon="inline-start" />
      {salvando ? "Salvando..." : children}
    </Button>
  );
}

function DadosPessoais({ usuario }: { usuario: Props["usuario"] }) {
  const inicial = {
    name: usuario.nome,
    pais: usuario.pais,
    telefone: mascaraTelefone(usuario.telefone, usuario.pais),
    cpf: mascaraCpf(usuario.cpf),
  };
  const [d, setD] = useState(inicial);
  const [salvo, setSalvo] = useState(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, start] = useTransition();
  const alterado = JSON.stringify(d) !== JSON.stringify(salvo);
  const pais = paisPorCodigo(d.pais);
  const set = (k: keyof typeof inicial, v: string) => {
    setD((a) => ({ ...a, [k]: v }));
    setErros((e) => {
      const n = { ...e };
      delete n[k];
      return n;
    });
  };

  return (
    <Cartao
      icone={User}
      titulo="Dados pessoais"
      descricao="Usados no seu cadastro e na cobrança do plano."
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await salvarDadosPessoais(d);
            if (r.ok) {
              setSalvo(d);
              notificar.sucesso("Dados atualizados", "Seu perfil foi salvo.");
            } else {
              setErros(r.erros ?? {});
              notificar.erro("Não foi possível salvar", r.mensagem);
            }
          });
        }}
      >
        <CampoAcesso
          id="perfil-name"
          rotulo="Nome completo"
          icone={User}
          value={d.name}
          erro={erros.name}
          autoComplete="name"
          onChange={(e) => set("name", e.target.value)}
        />
        <CampoAcesso
          id="perfil-email"
          rotulo="E-mail"
          icone={Mail}
          value={usuario.email}
          readOnly
          disabled
          dica="O e-mail é o seu login e não pode ser alterado aqui."
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="perfil-pais" className="text-sm font-medium">
            País
          </label>
          <div className="relative flex h-11 items-center rounded-xl border border-input bg-background/60 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
            <span
              className="pointer-events-none absolute left-3 flex"
              aria-hidden
            >
              <Bandeira codigo={pais.codigo} />
            </span>
            <select
              id="perfil-pais"
              value={d.pais}
              onChange={(e) => {
                set("pais", e.target.value);
                set("telefone", mascaraTelefone(d.telefone, e.target.value));
              }}
              className="h-full w-full appearance-none rounded-xl bg-transparent pr-9 pl-11 text-sm outline-none"
            >
              {PAISES.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.nome}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted-foreground" />
          </div>
        </div>
        <CampoAcesso
          id="perfil-telefone"
          rotulo="Telefone (WhatsApp)"
          type="tel"
          inputMode="tel"
          value={d.telefone}
          erro={erros.telefone}
          prefixo={
            <span className="shrink-0 border-r border-border pr-2 text-sm text-muted-foreground">
              +{pais.ddi}
            </span>
          }
          onChange={(e) =>
            set("telefone", mascaraTelefone(e.target.value, d.pais))
          }
        />
        {d.pais === "BR" && (
          <CampoAcesso
            id="perfil-cpf"
            rotulo="CPF"
            icone={IdCard}
            inputMode="numeric"
            value={d.cpf}
            erro={erros.cpf}
            placeholder="000.000.000-00"
            onChange={(e) => set("cpf", mascaraCpf(e.target.value))}
          />
        )}
        <BotaoSalvar salvando={salvando} alterado={alterado} />
      </form>
    </Cartao>
  );
}

function DadosNegocio({ negocio }: { negocio: Props["negocio"] }) {
  const [nome, setNome] = useState(negocio.nome);
  const [salvo, setSalvo] = useState(negocio.nome);
  const [erro, setErro] = useState<string>();
  const [salvando, start] = useTransition();
  return (
    <Cartao
      icone={Store}
      titulo="Seu negócio"
      descricao="O nome aparece no menu e nos relatórios em PDF."
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await salvarNegocio({ nome });
            if (r.ok) {
              setSalvo(nome.trim());
              setNome(nome.trim());
              notificar.sucesso("Negócio atualizado", nome.trim());
            } else setErro(r.mensagem);
          });
        }}
      >
        <CampoAcesso
          id="perfil-negocio"
          rotulo="Nome do negócio"
          icone={Store}
          value={nome}
          erro={erro}
          placeholder="Ex.: Doces da Maria"
          onChange={(e) => {
            setNome(e.target.value);
            setErro(undefined);
          }}
        />
        <BotaoSalvar salvando={salvando} alterado={nome.trim() !== salvo} />
      </form>
    </Cartao>
  );
}

function Senha({
  temSenha,
  temGoogle,
}: {
  temSenha: boolean;
  temGoogle: boolean;
}) {
  const vazio = { atual: "", nova: "", confirmar: "" };
  const [d, setD] = useState(vazio);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, start] = useTransition();
  const [comSenha, setComSenha] = useState(temSenha);
  const set = (k: keyof typeof vazio, v: string) => {
    setD((a) => ({ ...a, [k]: v }));
    setErros((e) => {
      const n = { ...e };
      delete n[k];
      return n;
    });
  };
  return (
    <Cartao
      icone={KeyRound}
      titulo={comSenha ? "Alterar senha" : "Criar senha"}
      descricao={
        comSenha
          ? "Ao trocar, os outros aparelhos conectados saem da conta."
          : temGoogle
            ? "Você entra com o Google. Crie uma senha para entrar também com o e-mail."
            : "Defina uma senha para a sua conta."
      }
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            // Quem já tem senha troca pelo cliente do login: a sessão é renovada e o
            // cookie novo chega ao navegador (pela ação no servidor, a sessão se perdia).
            const r = comSenha
              ? await trocarSenhaNoCliente(d)
              : await criarSenha(d);
            if (r.ok) {
              setD(vazio);
              setComSenha(true);
              notificar.sucesso(
                comSenha ? "Senha alterada" : "Senha criada",
                "Use a nova senha no próximo acesso.",
              );
            } else {
              setErros(r.erros ?? {});
              notificar.erro("Não foi possível alterar a senha", r.mensagem);
            }
          });
        }}
      >
        {comSenha && (
          <CampoSenha
            id="senha-atual"
            rotulo="Senha atual"
            icone={Lock}
            autoComplete="current-password"
            value={d.atual}
            erro={erros.atual}
            onChange={(e) => set("atual", e.target.value)}
          />
        )}
        <CampoSenha
          id="senha-nova"
          rotulo="Nova senha"
          icone={Lock}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={d.nova}
          erro={erros.nova}
          onChange={(e) => set("nova", e.target.value)}
        />
        <CampoSenha
          id="senha-confirmar"
          rotulo="Confirmar nova senha"
          icone={Lock}
          autoComplete="new-password"
          value={d.confirmar}
          erro={erros.confirmar}
          onChange={(e) => set("confirmar", e.target.value)}
        />
        <BotaoSalvar salvando={salvando} alterado={Boolean(d.nova)}>
          {comSenha ? "Alterar senha" : "Criar senha"}
        </BotaoSalvar>
      </form>
    </Cartao>
  );
}
