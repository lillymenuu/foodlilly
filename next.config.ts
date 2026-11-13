import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Endereços antigos continuam funcionando (favoritos, abas abertas).
  // Temporários (307) enquanto a estrutura de telas ainda pode mudar.
  async redirects() {
    return [
      { source: "/painel", destination: "/dashboard", permanent: false },
      {
        source: "/modulo-financeiro/lancamentos",
        destination: "/modulo-financeiro/gastos-recebimentos",
        permanent: false,
      },
      {
        source: "/modulo-gestao-financeira/:caminho*",
        destination: "/modulo-financeiro/:caminho*",
        permanent: false,
      },
      { source: "/inicio", destination: "/dashboard", permanent: false },
      {
        source: "/precificar/:caminho*",
        destination: "/modulo-precificacao/:caminho*",
        permanent: false,
      },
      {
        source: "/estoque/:caminho*",
        destination: "/modulo-estoque/:caminho*",
        permanent: false,
      },
      {
        source: "/financeiro/:caminho*",
        destination: "/modulo-financeiro/:caminho*",
        permanent: false,
      },
      {
        source: "/producao/:caminho*",
        destination: "/modulo-producao/:caminho*",
        permanent: false,
      },
      {
        source: "/equipe/:caminho*",
        destination: "/modulo-funcionario/:caminho*",
        permanent: false,
      },
      {
        source: "/precificacao",
        destination: "/modulo-precificacao",
        permanent: false,
      },
      {
        source: "/insumos",
        destination: "/modulo-precificacao/insumos",
        permanent: false,
      },
      {
        source: "/receitas",
        destination: "/modulo-precificacao/receitas",
        permanent: false,
      },
      {
        source: "/custos",
        destination: "/modulo-precificacao/custeio",
        permanent: false,
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
