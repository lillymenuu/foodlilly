"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, ChevronRight, CreditCard, Lock, LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { encontrarRota, navegacao, type Modulo } from "@/config/navegacao";

const ativoNoMenu = "data-active:[&>svg:first-child]:text-sidebar-primary";

/** Menu com o item da página atual marcado (precisa de <Suspense> no layout). */
export function AppSidebarAtual() {
  return <AppSidebar pathname={usePathname()} />;
}

/**
 * Sem `pathname` (versão provisória do <Suspense>, em rotas dinâmicas como
 * /ficha/[id]), mostra o menu sem item marcado.
 */
export function AppSidebar({ pathname = "" }: { pathname?: string }) {
  const { setOpenMobile } = useSidebar();
  const rota = encontrarRota(pathname);

  // Só um módulo aberto por vez; ao navegar, abre o módulo da página atual.
  const [aberto, setAberto] = useState(rota?.modulo.href);
  const [ultimoPathname, setUltimoPathname] = useState(pathname);
  if (pathname !== ultimoPathname) {
    setUltimoPathname(pathname);
    setAberto(rota?.modulo.href);
  }

  const fecharNoCelular = () => setOpenMobile(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
        <Link
          href="/dashboard"
          onClick={fecharNoCelular}
          className="flex items-center gap-2 px-1"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ChefHat className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white group-data-[collapsible=icon]:hidden">
            foodlilly
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {navegacao.map((modulo) =>
              modulo.paginas ? (
                <ModuloComSubmenu
                  key={modulo.href}
                  modulo={modulo}
                  ativo={rota?.modulo.href === modulo.href}
                  paginaAtiva={rota?.pagina?.href}
                  aberto={aberto === modulo.href}
                  onAbrir={(abrir) => setAberto(abrir ? modulo.href : undefined)}
                  onNavegar={fecharNoCelular}
                />
              ) : (
                <SidebarMenuItem key={modulo.href}>
                  <SidebarMenuButton
                    isActive={rota?.modulo.href === modulo.href}
                    tooltip={modulo.titulo}
                    render={<Link href={modulo.href} onClick={fecharNoCelular} />}
                    className={`h-10 ${ativoNoMenu}`}
                  >
                    <modulo.icone />
                    <span>{modulo.titulo}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/assinatura"}
              tooltip="Assinatura"
              render={<Link href="/assinatura" onClick={fecharNoCelular} />}
              className={`h-10 ${ativoNoMenu}`}
            >
              <CreditCard />
              <span>Assinatura</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Usuário fixo até a autenticação existir. */}
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <Avatar className="size-8">
                <AvatarFallback className="bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                  CA
                </AvatarFallback>
              </Avatar>
              <span className="grid flex-1 leading-tight">
                <span className="truncate text-sm font-medium text-white">
                  Cantina da Ana
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  ana@exemplo.com
                </span>
              </span>
            </SidebarMenuButton>
            <SidebarMenuAction
              render={<Link href="/" />}
              className="top-3! size-6"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut />
            </SidebarMenuAction>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function ModuloComSubmenu({
  modulo,
  ativo,
  paginaAtiva,
  aberto,
  onAbrir,
  onNavegar,
}: {
  modulo: Modulo;
  ativo: boolean;
  paginaAtiva?: string;
  aberto: boolean;
  onAbrir: (abrir: boolean) => void;
  onNavegar: () => void;
}) {
  const { isMobile, state } = useSidebar();
  const soIcones = state === "collapsed" && !isMobile;

  return (
    <SidebarMenuItem>
      <Collapsible open={aberto} onOpenChange={onAbrir}>
        <SidebarMenuButton
          isActive={ativo && !paginaAtiva}
          tooltip={modulo.titulo}
          render={
            <Link
              href={modulo.href}
              onClick={() => {
                // Abre o submenu e mostra a página do módulo. No celular a
                // gaveta continua aberta para a pessoa escolher a subpágina.
                if (aberto && ativo) onAbrir(false);
                else onAbrir(true);
                if (soIcones) onNavegar();
              }}
            />
          }
          className={`h-10 ${ativoNoMenu} ${ativo ? "[&>svg:first-child]:text-sidebar-primary" : ""}`}
        >
          <modulo.icone />
          <span>{modulo.titulo}</span>
          {modulo.selo && (
            <span className="rounded bg-sidebar-primary px-1.5 py-px text-[10px] font-semibold uppercase text-sidebar-primary-foreground">
              {modulo.selo}
            </span>
          )}
          <ChevronRight
            className={`ml-auto transition-transform duration-200 ${aberto ? "rotate-90" : ""}`}
          />
        </SidebarMenuButton>

        <CollapsibleContent>
          <SidebarMenuSub className="my-1">
            {modulo.paginas?.map((pagina) => (
              <SidebarMenuSubItem key={pagina.href}>
                {pagina.bloqueado ? (
                  <span
                    aria-disabled="true"
                    title="Em breve"
                    className="flex h-8 items-center gap-2 px-2 text-sm text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden [&>svg]:size-4"
                  >
                    <Lock />
                    <span className="truncate">{pagina.titulo}</span>
                  </span>
                ) : (
                  <SidebarMenuSubButton
                    isActive={paginaAtiva === pagina.href}
                    render={<Link href={pagina.href} onClick={onNavegar} />}
                    className="h-8 data-active:font-medium data-active:[&>svg]:text-sidebar-primary"
                  >
                    <pagina.icone />
                    <span>{pagina.titulo}</span>
                  </SidebarMenuSubButton>
                )}
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
