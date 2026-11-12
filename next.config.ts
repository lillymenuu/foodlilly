import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Endereços antigos continuam funcionando (favoritos, abas abertas).
  // Temporários (307) enquanto a estrutura de telas ainda pode mudar.
  async redirects() {
    return [
      { source: "/painel", destination: "/dashboard", permanent: false },
      { source: "/inicio", destination: "/dashboard", permanent: false },
      { source: "/precificacao", destination: "/precificar", permanent: false },
      { source: "/insumos", destination: "/precificar/insumos", permanent: false },
      { source: "/receitas", destination: "/precificar/receitas", permanent: false },
      { source: "/custos", destination: "/precificar/custeio", permanent: false },
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
