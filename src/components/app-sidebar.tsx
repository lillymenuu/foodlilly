"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  Carrot,
  ChefHat,
  CookingPot,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Wallet,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Itens provisórios: a lista final sai do documento de escopo.
const principal = [
  { title: "Painel", href: "/painel", icon: LayoutDashboard },
  { title: "Insumos", href: "/insumos", icon: Carrot },
  { title: "Receitas", href: "/receitas", icon: CookingPot },
  { title: "Custos fixos", href: "/custos", icon: Wallet },
  { title: "Precificação", href: "/precificacao", icon: Calculator },
];

const conta = [{ title: "Assinatura", href: "/assinatura", icon: CreditCard }];

function NavGroup({
  label,
  items,
}: {
  label: string;
  items: typeof principal;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/60">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const ativo =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={ativo}
                  tooltip={item.title}
                  render={<Link href={item.href} />}
                  className="h-10 data-active:[&_svg]:text-sidebar-primary"
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/painel" />}
              className="hover:bg-transparent active:bg-transparent"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <ChefHat className="size-5!" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-white">
                foodlilly
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Gestão" items={principal} />
        <NavGroup label="Conta" items={conta} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Sair: será ligado à autenticação. */}
            <SidebarMenuButton tooltip="Sair" render={<Link href="/" />}>
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
