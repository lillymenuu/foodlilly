"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { encontrarRota } from "@/config/navegacao";

export function AppBreadcrumb() {
  const pathname = usePathname(); // precisa de <Suspense> no layout (rotas dinâmicas)
  const rota = encontrarRota(pathname);

  const trilha: { titulo: string; href: string }[] = [];
  if (rota && rota.modulo.href !== "/dashboard") trilha.push(rota.modulo);
  if (rota?.pagina) trilha.push(rota.pagina);
  if (!rota && pathname === "/assinatura") {
    trilha.push({ titulo: "Assinatura", href: "/assinatura" });
  }
  if (!rota && pathname === "/perfil") {
    trilha.push({ titulo: "Meu perfil", href: "/perfil" });
  }

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem
          className={trilha.length ? "hidden sm:inline-flex" : ""}
        >
          {trilha.length ? (
            <BreadcrumbLink
              render={<Link href="/dashboard" />}
              className="flex items-center gap-1.5"
            >
              <LayoutDashboard className="size-3.5" />
              Dashboard
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="flex items-center gap-1.5">
              <LayoutDashboard className="size-3.5" />
              Dashboard
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {trilha.map((item, i) => {
          const ultimo = i === trilha.length - 1;
          // No celular mostra só a página atual, para não quebrar linha.
          const soDesktop = ultimo ? "" : "hidden sm:inline-flex";
          return (
            <Fragment key={item.href}>
              <BreadcrumbSeparator className="hidden sm:inline-flex" />
              <BreadcrumbItem className={`min-w-0 ${soDesktop}`}>
                {ultimo ? (
                  <BreadcrumbPage className="truncate font-medium">
                    {item.titulo}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={item.href} />}>
                    {item.titulo}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
