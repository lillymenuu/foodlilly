"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, Lock, Mail } from "lucide-react";

import {
  BotaoAcesso,
  BotaoGoogle,
  CampoAcesso,
  CampoSenha,
  Divisor,
  mensagemErroAcesso,
} from "@/components/acesso";
import { authClient } from "@/lib/auth-client";

export function FormEntrar({
  voltar,
  google,
}: {
  voltar: string;
  google: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState<string>();
  const [entrando, setEntrando] = useState<"email" | "google" | null>(null);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !senha) return setErro("Informe o e-mail e a senha.");
    setErro(undefined);
    setEntrando("email");
    const { error } = await authClient.signIn.email({
      email: email.trim().toLowerCase(),
      password: senha,
      rememberMe: lembrar,
    });
    if (error) {
      setEntrando(null);
      return setErro(mensagemErroAcesso(error));
    }
    router.replace(voltar);
    router.refresh();
  }

  async function entrarGoogle() {
    setErro(undefined);
    setEntrando("google");
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: voltar,
      newUserCallbackURL: "/dashboard?bemvindo=1",
      errorCallbackURL: "/entrar?erro=google",
    });
    if (error) {
      setEntrando(null);
      setErro(mensagemErroAcesso(error));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Entrar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use o e-mail e a senha do seu cadastro.
        </p>
      </div>

      <form onSubmit={entrar} noValidate className="flex flex-col gap-4">
        <CampoAcesso
          id="email"
          rotulo="E-mail"
          icone={Mail}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <CampoSenha
          id="senha"
          rotulo="Senha"
          icone={Lock}
          autoComplete="current-password"
          placeholder="Sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={lembrar}
            onChange={(e) => setLembrar(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Manter conectado
        </label>

        {erro && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive animate-in fade-in slide-in-from-top-1"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {erro}
          </p>
        )}

        <BotaoAcesso
          type="submit"
          carregando={entrando === "email"}
          disabled={entrando !== null}
        >
          Entrar
        </BotaoAcesso>
      </form>

      {google && (
        <>
          <Divisor>ou</Divisor>
          <BotaoGoogle
            onClick={entrarGoogle}
            carregando={entrando === "google"}
          >
            Entrar com Google
          </BotaoGoogle>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Novo por aqui?{" "}
        <Link
          href="/cadastro"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Criar conta grátis
        </Link>
      </p>
    </div>
  );
}
