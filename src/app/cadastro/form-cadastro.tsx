"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  CircleAlert,
  IdCard,
  Lock,
  Mail,
  Ticket,
  User,
} from "lucide-react";
import { cn } from "cn";

import {
  BotaoAcesso,
  BotaoGoogle,
  CampoAcesso,
  CampoSenha,
  Divisor,
  mensagemErroAcesso,
} from "@/components/acesso";
import { Bandeira } from "@/components/bandeira";
import { authClient } from "@/lib/auth-client";
import {
  errosDoZod,
  esquemaCadastro,
  mascaraCpf,
  mascaraTelefone,
  PAISES,
  paisPorCodigo,
  SENHA_MINIMA,
  somenteDigitos,
} from "@/lib/cadastro";

const VAZIO = {
  pais: "BR",
  name: "",
  telefone: "",
  email: "",
  confirmarEmail: "",
  cpf: "",
  password: "",
  confirmarSenha: "",
  codigoIndicacao: "",
  aceitouTermos: false,
  aceitouPrivacidade: false,
};

/** Força da senha de 0 a 4 (só para orientar; a regra é o tamanho mínimo). */
function forcaSenha(s: string) {
  let p = 0;
  if (s.length >= SENHA_MINIMA) p++;
  if (s.length >= 12) p++;
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) p++;
  if (/\d/.test(s) && /[^a-zA-Z0-9]/.test(s)) p++;
  return s ? Math.max(1, p) : 0;
}
const NIVEIS = ["", "Fraca", "Razoável", "Boa", "Forte"];
const CORES_NIVEL = [
  "",
  "bg-destructive",
  "bg-highlight",
  "bg-success/70",
  "bg-success",
];

export function FormCadastro({
  google,
  plano,
}: {
  google: boolean;
  plano?: string;
}) {
  const router = useRouter();
  const [d, setD] = useState(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState<"email" | "google" | null>(null);
  const pais = paisPorCodigo(d.pais);
  const brasil = d.pais === "BR";
  const forca = forcaSenha(d.password);

  const set = <K extends keyof typeof VAZIO>(k: K, v: (typeof VAZIO)[K]) => {
    setD((a) => ({ ...a, [k]: v }));
    if (erros[k])
      setErros((e) => {
        const n = { ...e };
        delete n[k];
        return n;
      });
  };

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErroGeral(undefined);
    const r = esquemaCadastro.safeParse({ ...d, cpf: brasil ? d.cpf : "" });
    if (!r.success) {
      const novos = errosDoZod(r.error);
      setErros(novos);
      document.getElementById(`cad-${Object.keys(novos)[0]}`)?.focus();
      return;
    }
    setEnviando("email");
    const { error } = await authClient.signUp.email({
      name: r.data.name,
      email: r.data.email,
      password: r.data.password,
      pais: d.pais,
      telefone: somenteDigitos(r.data.telefone),
      cpf: brasil ? somenteDigitos(r.data.cpf) : undefined,
      codigoIndicacao: r.data.codigoIndicacao || undefined,
    });
    if (error) {
      setEnviando(null);
      if (error.code?.startsWith("USER_ALREADY_EXISTS"))
        setErros({ email: mensagemErroAcesso(error) });
      else setErroGeral(mensagemErroAcesso(error));
      return;
    }
    router.replace(`/dashboard?bemvindo=1${plano ? `&plano=${plano}` : ""}`);
    router.refresh();
  }

  async function cadastrarGoogle() {
    setEnviando("google");
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
      newUserCallbackURL: "/dashboard?bemvindo=1",
      errorCallbackURL: "/cadastro?erro=google",
    });
    if (error) {
      setEnviando(null);
      setErroGeral(mensagemErroAcesso(error));
    }
  }

  const campo = (k: keyof typeof VAZIO) => ({
    id: `cad-${k}`,
    value: String(d[k]),
    erro: erros[k],
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Crie sua conta
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Leva um minuto. Os 7 dias grátis começam agora, sem cartão.
        </p>
      </div>

      {google && (
        <>
          <BotaoGoogle
            onClick={cadastrarGoogle}
            carregando={enviando === "google"}
          >
            Cadastrar com Google
          </BotaoGoogle>
          <p className="-mt-3 text-center text-xs text-muted-foreground">
            Ao continuar com o Google, você aceita os{" "}
            <Link
              href="/termos"
              target="_blank"
              className="underline underline-offset-2"
            >
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link
              href="/privacidade"
              target="_blank"
              className="underline underline-offset-2"
            >
              Política de Privacidade
            </Link>
            .
          </p>
          <Divisor>ou com e-mail</Divisor>
        </>
      )}

      <form
        onSubmit={cadastrar}
        noValidate
        className="grid gap-4 sm:grid-cols-2"
      >
        {/* País */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="cad-pais" className="text-sm font-medium">
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
              id="cad-pais"
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
          {...campo("name")}
          rotulo="Nome completo"
          icone={User}
          autoComplete="name"
          placeholder="Seu nome e sobrenome"
          onChange={(e) => set("name", e.target.value)}
          className="sm:col-span-2"
        />

        <CampoAcesso
          {...campo("telefone")}
          rotulo="Telefone (WhatsApp)"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={brasil ? "(11) 91234-5678" : "Número"}
          prefixo={
            <span className="flex shrink-0 items-center gap-1.5 border-r border-border pr-2 text-sm text-muted-foreground">
              <Bandeira codigo={pais.codigo} />+{pais.ddi}
            </span>
          }
          onChange={(e) =>
            set("telefone", mascaraTelefone(e.target.value, d.pais))
          }
          className="sm:col-span-2"
        />

        <CampoAcesso
          {...campo("email")}
          rotulo="E-mail"
          icone={Mail}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          onChange={(e) => set("email", e.target.value)}
        />
        <CampoAcesso
          {...campo("confirmarEmail")}
          rotulo="Confirmar e-mail"
          icone={Mail}
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder="Repita o e-mail"
          onPaste={(e) => e.preventDefault()}
          onChange={(e) => set("confirmarEmail", e.target.value)}
        />

        {brasil && (
          <CampoAcesso
            {...campo("cpf")}
            rotulo="CPF"
            icone={IdCard}
            inputMode="numeric"
            placeholder="000.000.000-00"
            onChange={(e) => set("cpf", mascaraCpf(e.target.value))}
            className="sm:col-span-2"
          />
        )}

        <div className="flex flex-col gap-1.5">
          <CampoSenha
            {...campo("password")}
            rotulo="Senha"
            icone={Lock}
            autoComplete="new-password"
            placeholder={`Mínimo ${SENHA_MINIMA} caracteres`}
            onChange={(e) => set("password", e.target.value)}
          />
          {d.password && !erros.password && (
            <div className="flex items-center gap-2" aria-live="polite">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-300",
                      n <= forca ? CORES_NIVEL[forca] : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <span className="w-14 text-right text-[11px] text-muted-foreground">
                {NIVEIS[forca]}
              </span>
            </div>
          )}
        </div>
        <CampoSenha
          {...campo("confirmarSenha")}
          rotulo="Confirmar senha"
          icone={Lock}
          autoComplete="new-password"
          placeholder="Repita a senha"
          onChange={(e) => set("confirmarSenha", e.target.value)}
        />

        <CampoAcesso
          {...campo("codigoIndicacao")}
          rotulo="Código de indicação (opcional)"
          icone={Ticket}
          placeholder="Se alguém indicou o foodlilly"
          onChange={(e) => set("codigoIndicacao", e.target.value)}
          className="sm:col-span-2"
        />

        <div className="flex flex-col gap-2 sm:col-span-2">
          {(
            [
              ["aceitouTermos", "/termos", "Termos de Uso"],
              ["aceitouPrivacidade", "/privacidade", "Política de Privacidade"],
            ] as const
          ).map(([k, href, nome]) => (
            <div key={k}>
              <label className="flex w-fit cursor-pointer items-start gap-2 text-sm select-none">
                <input
                  id={`cad-${k}`}
                  type="checkbox"
                  checked={d[k]}
                  onChange={(e) => set(k, e.target.checked)}
                  aria-invalid={Boolean(erros[k])}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                />
                <span>
                  Li e aceito {nome === "Termos de Uso" ? "os" : "a"}{" "}
                  <Link
                    href={href}
                    target="_blank"
                    className="font-medium text-primary underline underline-offset-2"
                  >
                    {nome}
                  </Link>
                </span>
              </label>
              {erros[k] && (
                <p className="mt-1 ml-6 text-xs text-destructive">{erros[k]}</p>
              )}
            </div>
          ))}
        </div>

        {erroGeral && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive sm:col-span-2"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {erroGeral}
          </p>
        )}

        <BotaoAcesso
          type="submit"
          carregando={enviando === "email"}
          disabled={enviando !== null}
          className="sm:col-span-2"
        >
          Criar conta e começar o teste
        </BotaoAcesso>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href="/entrar"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
