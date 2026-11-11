@AGENTS.md

# foodlilly

SaaS de **precificação para negócios de alimentação** (food service): o cliente assina um plano e usa o sistema para calcular preços. Interface e textos em **português (pt-BR)**.

Referência de funcionalidades: plataforma.foodwise.app.br. Usar apenas como inspiração de funcionalidades. Nome, visual, layout e textos do foodlilly devem ser próprios.

## Perfis de acesso

- **Cliente**: cadastro, login, assinatura do plano (pagamento via Pix) e uso do sistema.
- **SuperAdmin** (dono do sistema): dashboard para gerenciar clientes e assinaturas (ativas, vencidas, pagamentos recebidos, bloquear e liberar acessos).

## Stack

- **Next.js 16** (App Router, pasta `src/`), **TypeScript**, **Tailwind CSS 4**
- **UI**: shadcn/ui (sugerido), com gráficos do shadcn ou do Tremor no dashboard do SuperAdmin
- **Banco**: PostgreSQL no **Neon** (banco `dblillyfood`), acessado pela variável `DATABASE_URL` (connection string *pooled*)
- **ORM**: a definir (recomendado: Drizzle; alternativa: Prisma)
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
- [ ] Escolha do ORM
- [ ] Prints das telas de referência (salvar em `referencias/`)
- [ ] Documento de escopo: telas do cliente, painel SuperAdmin, modelo de dados, fluxo do Pix. Aprovar antes de implementar as funcionalidades.
