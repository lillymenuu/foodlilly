import { Suspense } from "react";
import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { planoPorChave } from "@/config/planos";
import { db } from "@/db";
import { contasAcesso, usuarios } from "@/db/schema";
import {
  acessoDo,
  obterNegocioAtual,
  obterUsuarioAtual,
} from "@/lib/negocio-atual";

import { TelaPerfil } from "./tela-perfil";

export const metadata: Metadata = { title: "Meu perfil · foodlilly" };

export default function Page() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection();
  const sessaoUsuario = await obterUsuarioAtual();
  const [[usuario], negocio, contas] = await Promise.all([
    db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, sessaoUsuario.id))
      .limit(1),
    obterNegocioAtual(),
    db
      .select({ provedor: contasAcesso.providerId })
      .from(contasAcesso)
      .where(and(eq(contasAcesso.userId, sessaoUsuario.id))),
  ]);
  const acesso = acessoDo(negocio);
  return (
    <TelaPerfil
      usuario={{
        nome: usuario.name,
        email: usuario.email,
        pais: usuario.pais,
        telefone: usuario.telefone ?? "",
        cpf: usuario.cpf ?? "",
        criadoEm: usuario.createdAt.toISOString(),
      }}
      negocio={{ nome: negocio.nome }}
      temSenha={contas.some((c) => c.provedor === "credential")}
      temGoogle={contas.some((c) => c.provedor === "google")}
      acesso={{
        situacao: acesso.situacao,
        ate: acesso.ate?.toISOString() ?? null,
        dias: acesso.dias,
        plano: planoPorChave(negocio.plano).nome,
      }}
    />
  );
}

function Carregando() {
  return (
    <>
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </>
  );
}
