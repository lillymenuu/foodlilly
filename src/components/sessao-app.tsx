import { redirect } from "next/navigation";

import { AppSidebarAtual } from "@/components/app-sidebar";
import { BloqueioVencido } from "@/components/bloqueio-vencido";
import { Badge } from "@/components/ui/badge";
import { planoPorChave } from "@/config/planos";
import { acessoDo, obterNegocioAtual, obterSessao } from "@/lib/negocio-atual";

/** Menu lateral com o usuário logado (sem sessão, vai para o login). */
export async function SidebarSessao() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/entrar");
  const negocio = await obterNegocioAtual();
  const vencido = acessoDo(negocio).situacao === "expirado";
  return (
    <>
      <AppSidebarAtual
        usuario={{
          nome: sessao.user.name,
          email: sessao.user.email,
          negocio: negocio.nome,
        }}
      />
      {vencido && <BloqueioVencido />}
    </>
  );
}

/** Selo no topo: teste, plano ativo ou acesso vencido. */
export async function SeloAcesso() {
  const negocio = await obterNegocioAtual();
  const a = acessoDo(negocio);
  const texto =
    a.situacao === "isento"
      ? "Acesso liberado"
      : a.situacao === "pago"
        ? `${planoPorChave(negocio.plano).nome} · ativo`
        : a.situacao === "teste"
          ? `Teste grátis · ${a.dias === 1 ? "último dia" : `${a.dias} dias`}`
          : "Acesso vencido";
  return (
    <Badge
      variant="secondary"
      className={
        a.situacao === "expirado"
          ? "bg-destructive/10 text-destructive"
          : a.situacao === "teste"
            ? "bg-highlight-soft text-highlight-foreground"
            : undefined
      }
    >
      {texto}
    </Badge>
  );
}
