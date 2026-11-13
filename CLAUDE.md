@AGENTS.md

# foodlilly

SaaS de **precificação para negócios de alimentação** (food service): o cliente assina um plano e usa o sistema para calcular preços. Interface e textos em **português (pt-BR)**.

Referência de funcionalidades: plataforma.foodwise.app.br. Usar apenas como inspiração de funcionalidades. Nome, visual, layout e textos do foodlilly devem ser próprios.

## Perfis de acesso

- **Cliente**: cadastro, login, assinatura do plano (pagamento via Pix) e uso do sistema.
- **SuperAdmin** (dono do sistema): dashboard para gerenciar clientes e assinaturas (ativas, vencidas, pagamentos recebidos, bloquear e liberar acessos).

## Stack

- **Next.js 16** (App Router, pasta `src/`), **TypeScript**, **Tailwind CSS 4**
- **UI**: shadcn/ui (preset `base-nova`, sobre **Base UI**, não Radix: componentes usam a prop `render={<Link href="..." />}` em vez de `asChild`), ícones `lucide-react`, fonte Geist. Gráficos do shadcn ou do Tremor no dashboard do SuperAdmin
  - Adicionar componentes com `npx shadcn@latest add <nome>` e traduzir para pt-BR os textos em inglês que vierem neles (sr-only, aria-label)

## Identidade visual

Paleta definida em `src/app/globals.css` (tokens do tema; usar as classes, nunca hex soltos no código):

| Token | Cor | Uso |
|---|---|---|
| `primary` / `primary-strong` / `primary-soft` | `#143A5D` / `#0C3051` / `#DDE5EE` | Marinho: menu lateral, botões principais, card de destaque |
| `highlight` / `highlight-strong` / `highlight-soft` | `#F79C18` / `#E0811B` / `#FDECCD` | Laranja âmbar: ações de destaque (`<Button variant="highlight">`), ícones, avisos suaves |
| `background` / `card` | `#E8EBF0` / `#FFFFFF` | Fundo da página / cards |
| `foreground` / `muted-foreground` | `#1E2A3A` / `#5B6B7F` | Texto / texto secundário |
| `chart-1..5` | marinho, laranja, azul, laranja claro, cinza | Gráficos (marinho × laranja para comparar duas séries) |

- **Contraste:** laranja sempre com texto marinho (`text-highlight-foreground`), nunca com texto branco (2,2:1, reprova). Laranja sobre branco só em ícones, nunca em texto.
- **Modo escuro:** fica para depois (o bloco `.dark` foi removido do CSS).

## Estrutura das telas

- `src/app/page.tsx`: página inicial pública (landing: topo, lucro de cabeça × de verdade, 3 passos com simulador, recursos, teste de 7 dias, planos, dúvidas). Peças em `src/components/landing/`. Sem números de clientes ou depoimentos inventados.
- Páginas públicas: `/`, `/entrar`, `/cadastro`, `/termos`, `/privacidade` (lista em `src/proxy.ts`); o resto exige login.
- `src/app/(app)/`: área logada do cliente, com `layout.tsx` (menu lateral + cabeçalho com breadcrumb)
- **Navegação: fonte única em `src/config/navegacao.ts`.** Menu lateral (`app-sidebar.tsx`), breadcrumb (`app-breadcrumb.tsx`) e páginas centrais dos módulos (`modulo-hub.tsx`) leem dela. Tela nova = item no config + `page.tsx` na rota.
  - Módulos: Dashboard, Capacitação, Precificar, Estoque, Financeiro, Produção (Beta), Checklists, Modo funcionário, Novidades. Assinatura fica no rodapé do menu.
  - **Rotas de módulos com subpáginas usam o prefixo `modulo-`**: pastas e URLs `/modulo-precificacao`, `/modulo-estoque`, `/modulo-financeiro`, `/modulo-producao`, `/modulo-funcionario` (ex.: `/modulo-precificacao/custeio`). Os endereços antigos redirecionam (`next.config.ts`).
  - Módulo com subpáginas tem página central (`<ModuloHub href="/modulo" />`) com cards; `grupo` separa seções; `bloqueado: true` mostra cadeado e "Em breve", sem link nem página.
  - Subpáginas ainda vazias usam `<EmBreve href="..." />` (título e descrição vêm do config).
  - `dashboard/` (antigo Início): banner de boas-vindas + cards de "Serviços disponíveis" (3 colunas a partir de `xl`). Nome do usuário e plano ainda fixos no código.
- Menu: só um módulo aberto por vez; no celular, escolher uma subpágina fecha a gaveta.
- Inspiração das funcionalidades: menu da referência. Nomes de marca dela não são usados (ex.: "Deu Check" virou "Checklists").
## Telas com dados (padrão)

Referência: `src/app/(app)/modulo-precificacao/dados-de-entrada/`.

Peças compartilhadas (usar em toda tela nova desse tipo):
- `src/components/formulario/index.tsx`: `BannerFormulario` (título + progresso + Salvar), `CardGrupo` (grupo recolhível com progresso), `CampoNumero`, `InputUnidade`, `Dica`, `Aviso`, `BarraSalvarCelular`, `ModalSalvo`.
- `src/components/formulario/use-campos-numericos.ts`: estado dos campos (texto, erros, valores, formatação ao sair do campo).
- `src/lib/campos.ts` (tipo `Campo`, `campoMoeda` — já com máscara de dinheiro), `src/lib/numero-br.ts` (vírgula, R$, %, `mascaraMoeda`, `mascaraMilhar` para pesos/quantidades: "2700" -> "2.700"), `src/lib/validacao.ts` (`esquemaNumeros` zod, `errosPorCampo`).

Em cada tela:
- `campos.ts`: definição dos campos (rótulo, dica, unidade, padrão, limites). Tela, validação e banco leem daqui.
- `page.tsx` (Server Component): `<Suspense>` + componente async que chama `await connection()` e lê o banco (exigência do Cache Components).
- `actions.ts` (`"use server"`): valida com **zod**, obtém o negócio com `obterNegocioAtualId()` (nunca confiar em id vindo do navegador), grava com `db.batch([...])` e chama `refresh()`.
- Formulário (Client Component): números em pt-BR (vírgula), erro por campo, botão Salvar desabilitado sem alterações, barra fixa no rodapé no celular, modal de sucesso.
- **Negócio atual:** `obterNegocioAtualId()` em `src/lib/negocio-atual.ts` lê a sessão e devolve o negócio do usuário (com o acesso vencido, manda para `/assinatura`). Ver a seção Acesso.
- **Tabelas:** `negocios` (o cliente), `dados_entrada` e `custeio` (1 linha por negócio), `custos_extras` (lista, substituída inteira a cada salvamento), `equipamentos`, `funcionarios`, `insumos`, `categorias_insumo`, `fichas`, `ficha_itens` e `categorias_ficha` (cadastros; categoria com `sistema = true` não pode ser editada/excluída; excluir categoria com insumos exige mover para outra). Toda tabela de dados do cliente tem `negocio_id`.
- **Telas de cadastro (lista + criar/editar/excluir):** referências `modulo-precificacao/equipamentos/`, `/funcionarios/` e `/insumos/` (abas, categorias, modal dentro de modal, código de barras). Peças em `src/components/cadastro/index.tsx` (`BannerCadastro` com busca/ordenar/novo, `CardCadastro`, `VazioCadastro`, `ModalFormulario`, `CampoModal`, `ModalExcluir`); cabeçalho colorido dos modais em `src/components/modal-cabecalho.tsx` (novo = laranja, editar = marinho, excluir = vermelho); itens padrão com `garantirItensPadrao` (`src/lib/itens-padrao.ts`); busca/iniciais em `src/lib/texto.ts`. Actions sempre filtram por `negocio_id` ao editar/excluir. Itens padrão são criados na primeira visita e a data fica no negócio (`equipamentos_padrao_em`), para não recriar o que o cliente excluiu.
- **Notificações:** `notificar.sucesso(titulo, descricao)` (também `.erro`, `.info`) de `src/components/notificacoes.tsx` mostra um aviso flutuante no topo, centralizado, que some em 4 s (Sonner, estilizado com a paleta). Usar após criar/editar/excluir; não usar faixas fixas na página para confirmar ações.
- O banco do Neon é o **mesmo** em local e produção, e o dono do projeto também salva dados pelo site. Testes automatizados que gravam no banco: antes de começar, conferir se já existem dados (ex.: `atualizado_em`) e **não sobrescrever nem apagar dados que não foram criados pelo teste**; se o banco estiver vazio, apagar ao final o que o teste criou.

## Receitas e produtos (fichas técnicas)

Pasta `src/app/(app)/modulo-precificacao/receitas/`. Rotas: central `/receitas`, listas `/receitas/massas|recheios|produtos`, nova `/receitas/[tipo]/nova`, ficha `/receitas/ficha/[id]` (ficha salva abre só para visualizar, com campos travados; o botão "Editar" ou o lápis ao lado do nome libera a edição, com Cancelar/Salvar; ficha nova já abre editando), categorias `/receitas/categorias` (abas massas, recheios, produtos e insumos; `?tipo=` abre a aba).

- Tabelas: `fichas` (tipo massa/recheio/produto), `ficha_itens` (composição: ingrediente, embalagem, receita, produto, mão de obra, equipamento; uma referência por linha, cascade ao excluir o item referenciado) e `categorias_ficha` (por tipo; ao excluir, as fichas vão para outra categoria escolhida ou ficam sem categoria).
- **Custos não ficam gravados**: são calculados por `calculo.ts` (mesmo código no servidor e no navegador). Fórmulas conferidas com fichas reais da referência:
  - mão de obra = salário ÷ (dias × horas × 60) × minutos; equipamento elétrico = kW × h × R$/kWh; a gás = kg/h × h × (R$ botijão ÷ kg)
  - insumo = quantidade × custo real da unidade (com perda); receita/produto vinculado = gramas ÷ peso total × custo total
  - CMV = só ingredientes, sem embalagens (inclusive os das fichas vinculadas)
  - produto (só produtos têm margem e preço; a ficha de receita mostra só custos, como na referência): fabricação = custo/porção × (1 + % de custo fixo do Custeio) (acréscimo, não divisão: conferido com 5,40 × 1,432 = 7,73); preço = fabricação ÷ (1 − margem − imposto − taxa do crédito); revenda = fabricação ÷ (1 − margem revenda − imposto); marketplace = preço ÷ (1 − taxa do app)
- Lista (`lista-fichas.tsx`): Grade | Lista (lembrada no navegador). Card de produto mostra o preço no 1º app de entrega com "+N" (demais no `title`), Custo/Venda/Margem e faixa da margem (`classificarMargem`).
- Classificação da margem (`classificarMargem` em `calculo.ts`): abaixo de 35% Ruim (card da margem em vermelho), 35–40% Regular, a partir de 40% Boa, 60% Ótima e 90% Excelente (Ótima e Excelente com brilho animado na barra, utilitário `animate-brilho` em `globals.css`, parado com `prefers-reduced-motion`).
- Vínculos circulares são bloqueados (`dependentesDe`) no editor e no servidor.
- Receita (massa/recheio): seletor Massa | Recheio na ficha (troca zera a categoria; produto não troca de tipo); categoria e peso total obrigatórios; **tempo de preparo é calculado** = minutos de mão de obra + equipamentos (gravado em `tempo_preparo_min`).
- Pendente: foto, PDF da ficha, compartilhar, "meta de vendas".

## Custeio: Resumo financeiro

- Banner e card do Resumo ficam lado a lado a partir de `xl` (grid 3fr/2fr em `form-custeio.tsx`); abaixo disso, um embaixo do outro. O aviso de alíquota crítica (`AvisoCustoFixo`) fica abaixo dos dois.
- "Ver detalhes" abre um modal (`custeio/modal-resumo.tsx`) no estilo dos Relatórios: indicadores animados (receita, custos fixos, margem líquida, alíquota), barra "para onde vai a receita" com as marcas de 20% (atenção) e 30% (limite), rosca por grupo ligada aos cards, ranking dos maiores custos e uma dica conforme a situação. Grupos usam `--serie-1..5` pela ordem fixa do Custeio.
- Números que sobem: `NumeroAnimado` / `useContagem` em `src/components/numero-animado.tsx` (usados também nos Relatórios).

## Relatórios (`modulo-precificacao/relatorios/`)

- Lê os produtos com preço calculado (`carregarTudo`), valores por 1 unidade vendida: preço, custo = custo de fabricação, lucro = preço − custo, margem da ficha. Produtos sem preço válido ficam de fora (aviso na tela).
- Abas: Visão geral (indicadores, maior/menor margem, lista com filtro pela meta), Composição de custos (rosca + cards; passar o mouse num card destaca a fatia; variância e desvio padrão populacionais da margem) e Análise (margem por produto com linha da meta; preço = custo + lucro). "Baixar relatório" gera **PDF** A4 paisagem no navegador (`pdf.ts`, jspdf + jspdf-autotable, carregados só ao clicar): página 1 com Resumo financeiro, Composição de custos, Destaques e Análise estatística; depois a tabela "Detalhamento dos produtos" (peso, rendimento, custo de fabricação, preço, revenda, um preço por app de entrega com a taxa, preço/kg, margem R$ e %, nº de receitas); rodapé com o nome do negócio, data e "página / total". Cores do PDF em RGB espelhando `globals.css`.
- **Margem meta**: coluna `negocios.margem_meta` (padrão 30), editada pelo lápis do indicador (`salvarMargemMeta`).
- Gráficos: shadcn `chart` (Recharts 3). Cores por categoria em `--serie-1..5` (`globals.css`, utilitários `bg-serie-N`), ordem **validada para daltonismo** com o validador de paletas: não reordenar nem trocar sem validar. Legenda sempre visível; animações respeitam `prefers-reduced-motion`.

## Financeiro (`modulo-financeiro/`)

- **Contas** (`/modulo-financeiro/contas`, "Configurações financeiras"): tabela `contas_bancarias` (nome, tipo: corrente/poupança/carteira digital/pagamento/outro, saldo inicial que pode ser negativo, data do saldo inicial, padrão, cor do cartão). **Uma conta padrão por negócio** (índice único parcial): a primeira é sempre a padrão; a padrão só deixa de ser quando outra é marcada; ao excluir a padrão, a mais antiga vira padrão.
- Tela: banner com as abas Contas bancárias, Categorias e Fornecedores (as duas últimas com cadeado até existir conta; ainda "Em breve"), boas-vindas com 3 passos e modal "Vamos configurar juntos" quando não há contas, cartões no estilo cartão de banco (cores `--cartao-*` em `globals.css`), menu ⋮ com Editar, Definir como padrão e Excluir.
- **Categorias** (aba da mesma tela; `?aba=categorias` abre nela; liberada quando há conta): 6 grupos (Recebimentos, Gastos operacionais, Variáveis, Pessoas, Impostos, Aquisições). Tabela `categorias_financeiras`: **principais** com `chave` do catálogo (`contas/catalogo-categorias.ts`; fixas, só entram pelas Sugestões, não são renomeadas; alimentarão CMV e DRE) e **subcategorias** com `pai_id` (livres: criar, renomear, excluir; nome único dentro da principal). Excluir uma principal leva as subcategorias. Padrão Vendas → Revendas criado na primeira visita com conta (`garantirCategoriasPadrao`, data em `negocios.categorias_financeiras_padrao_em`). Modal de Sugestões: busca, principal com checkbox (ou "já adicionada"), subcategorias sugeridas que ainda não existem.
- **Fornecedores** (aba da mesma tela; `?aba=fornecedores`): tabela `fornecedores` (nome, telefone só dígitos, documento CPF/CNPJ sem máscara, e-mail, observações). CPF e CNPJ validados pelos dígitos verificadores, **inclusive o CNPJ alfanumérico** (em vigor desde julho de 2026: letras nas 12 primeiras posições, valor = ASCII − 48) em `src/lib/cadastro.ts` (`cnpjValido`, `mascaraDocumento`, `documentoValido`). Lista com busca (nome, e-mail, observações; telefone e documento pelos dígitos), modais de novo/editar, ver detalhes (com link do WhatsApp) e excluir.
- **Saldo atual** (`modulo-financeiro/saldos.ts`, `saldosDasContas`) = saldo inicial + recebimentos **pagos** − gastos **pagos**, só de lançamentos a partir de `data_saldo_inicial`. Conta com lançamentos não pode ser excluída; categoria (ou subcategoria dela) usada em lançamento também não.
- **Gastos e recebimentos** (`/modulo-financeiro/gastos-recebimentos`; `/lancamentos` e `/modulo-gestao-financeira/*` redirecionam): tabela `lancamentos` (conta, grupo, **subcategoria** obrigatória, data, valor sempre positivo, descrição, fornecedor reconhecido pelo nome ou nome livre, forma de pagamento, `pago`, série). Recebimentos entram, os outros 5 grupos saem (`ehEntrada`). Período e conta pelo endereço (`?inicio=&fim=&conta=`, padrão: mês atual); aba do grupo, busca, situação (pago/pendente/vencido = pendente com data passada) e categoria filtram no navegador. Indicadores: saldo atual (todas ou a conta), receitas e despesas do período (pago + a pagar), resultado.
- **Modal de lançamento:** tipo em abas, conta (padrão pré-selecionada), categoria e subcategoria com **salvas + sugestões do catálogo + "Nova subcategoria"** (as escolhidas nas sugestões ou digitadas são criadas ao salvar, em `resolver()` de `actions.ts`). **Parcelar** divide o total (centavos de sobra na 1ª parcela); **Recorrente** repete o valor; ambos mensais (`somarMeses` mantém o dia ou usa o último do mês), mesmo `serie_id`; "já pago" vale só para o 1º. Editar altera só aquele lançamento; excluir pode levar os próximos não pagos da série.
- Pendentes: Transferências entre contas, dividir transação, exportar/importar.

## Acesso (login, cadastro, teste grátis)

- **Better Auth** (`src/lib/auth.ts`, cliente em `src/lib/auth-client.ts`, rota `/api/auth/[...all]`), com Drizzle (`transaction: false`, o Neon HTTP não tem transações). Tabelas em português: `usuarios`, `sessoes`, `contas_acesso`, `verificacoes` (chaves JS no padrão do Better Auth). Segredo `BETTER_AUTH_SECRET` no `.env.local` e na Vercel.
- **Cadastro** (`/cadastro`): país (bandeiras SVG, `country-flag-icons`), nome, telefone com DDI, e-mail + confirmação, CPF (só Brasil, dígitos verificados), senha + confirmação, código de indicação (só guardado), aceite dos Termos e da Privacidade. Regras em `src/lib/cadastro.ts`, validadas também no servidor (gancho `/sign-up/email`). `/update-user` não altera telefone/CPF/país: isso é feito pelo Perfil.
- **Usuário novo** ganha um negócio com teste de 7 dias (`databaseHooks.user.create.after`). Negócio: `usuario_id` (único), `plano`, `teste_ate`, `pago_ate`, `isento`. Situação em `acessoDo()`: isento, pago, teste ou vencido.
- **Vencido:** as páginas e ações que usam `obterNegocioAtualId()` redirecionam para `/assinatura`; `BloqueioVencido` faz o mesmo no navegador. `/assinatura` e `/perfil` continuam abertos.
- **Proxy** (`src/proxy.ts`): checagem rápida pelo cookie; a verificação de verdade é no servidor. **`obterSessao()` chama `await connection()`** antes de ler a sessão (senão a leitura roda no pré-carregamento parcial e volta vazia).
- **Perfil** (`/perfil`): dados pessoais, nome do negócio, senha. Troca de senha pelo **cliente** (`authClient.changePassword`), porque pela Server Action o cookie da sessão renovada não chegava ao navegador; criar senha (conta só Google) é Server Action.
- **Google:** botões só aparecem com `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` configurados. Redirecionamento autorizado: `<site>/api/auth/callback/google`.
- **Planos:** fonte única em `src/config/planos.ts` (Gestão Básico R$ 32,32, Gestão Completa R$ 49,99; itens provisórios). Pix ainda não implementado (Assinatura mostra "em breve").
- O negócio de demonstração (`00000000-0000-4000-8000-000000000001`, dados do dono) está com `isento = true` e deve ser ligado à conta do dono depois do primeiro cadastro dele.

## Armadilhas já resolvidas (não repetir)

- `<Button render={<Link />}>`: o `Button` já passa `nativeButton={false}` sozinho quando há `render`; sem isso o Base UI avisa e dá erro de hidratação.
- O menu lateral e o breadcrumb usam `usePathname` e ficam em `<Suspense>` no layout (exigência das rotas dinâmicas com Cache Components). Por isso o `Sidebar` lê `useIsMobile()` direto, e não do provedor (senão dá erro de hidratação no celular).
- Em páginas com `params`, ler o parâmetro **dentro** do `<Suspense>` (passar a promise para o componente async).
- **Estado preservado entre navegações:** com Cache Components o Next esconde a página (`<Activity>`) em vez de desmontar, e o `useState` continua. Formulários de "novo cadastro" devem se limpar num `useLayoutEffect` de limpeza (ver `editor-ficha.tsx`); modais também devem fechar ao esconder. Guia: `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`.

- Área do SuperAdmin: a criar (ex.: `src/app/(admin)/admin/`)
- Funções de um arquivo `"use client"` não podem ser chamadas no servidor (ex.: `destinoSeguro` fica em `src/lib/destino.ts`).
- **Banco**: PostgreSQL 18 no **Neon**, projeto `dblillyfood` (banco `neondb`), criado pela integração Vercel ↔ Neon e conectado ao projeto `foodlilly` na Vercel. Acesso pela variável `DATABASE_URL` (connection string *pooled*). A integração também cria `DATABASE_URL_UNPOOLED` (conexão direta, útil para migrations).
- **ORM**: **Drizzle** com o driver `@neondatabase/serverless` (modo HTTP, `drizzle-orm/neon-http`)
  - Conexão em `src/db/index.ts` (importa `server-only`, nunca usar em Client Components); tabelas em `src/db/schema.ts`
  - Migrations em `drizzle/` (versionadas no Git): alterar o schema → `npm run db:generate` → revisar o SQL → `npm run db:migrate`
  - `npm run db:studio` abre um navegador visual do banco
  - O modo HTTP não suporta transações interativas (`db.transaction`). Se precisar (ex.: webhook do Pix), usar `db.batch([...])` ou trocar para `drizzle-orm/neon-serverless` (WebSocket)
- **Hospedagem**: Vercel, com deploy automático a cada push na `main`. Domínio próprio será comprado depois.
- **Repositório**: github.com/lillymenuu/foodlilly

## Pagamentos: Pix via Mercado Pago

Não usar recorrência automática por cartão. O fluxo é:

1. O sistema gera uma cobrança Pix (QR Code + copia e cola) para o período do plano.
2. O cliente paga.
3. O webhook do Mercado Pago confirma o pagamento, e o sistema libera ou renova o acesso até a nova data de vencimento.
4. Perto do vencimento, o sistema gera uma nova cobrança e avisa o cliente.

Validar sempre o webhook consultando o pagamento na API do Mercado Pago antes de liberar o acesso.

## Regras

- Segredos (`DATABASE_URL`, tokens do Mercado Pago etc.) ficam só em `.env.local` (ignorado pelo Git) e nas Environment Variables da Vercel. Nunca commitar segredos.
- O repositório é **público**.
- Rodar `npm run build` e `npm run lint` antes de enviar alterações.
- Vercel Hobby é só para uso não comercial. Migrar para o Pro quando começar a cobrar clientes.

## Pendências do alinhamento

- [ ] Lista final de tecnologias (vinda do dono do projeto)
- [x] Escolha do ORM (Drizzle)
- [ ] Prints das telas de referência (salvar em `referencias/`)
- [ ] Documento de escopo: telas do cliente, painel SuperAdmin, modelo de dados, fluxo do Pix. Aprovar antes de implementar as funcionalidades.
