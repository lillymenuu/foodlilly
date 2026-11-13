import type { Metadata } from "next";
import Link from "next/link";

import { PaginaLegal } from "@/components/pagina-legal";
import { DIAS_TESTE_GRATIS } from "@/config/planos";

export const metadata: Metadata = { title: "Termos de Uso · foodlilly" };

export default function Page() {
  return (
    <PaginaLegal titulo="Termos de Uso" atualizadoEm="13 de novembro de 2026">
      <p>
        Estes Termos de Uso explicam as regras para usar o foodlilly, um sistema
        on-line de precificação para negócios de alimentação. Ao criar uma
        conta, você declara que leu e concorda com estes termos e com a nossa{" "}
        <Link
          href="/privacidade"
          className="font-medium text-primary underline"
        >
          Política de Privacidade
        </Link>
        .
      </p>

      <h2>1. O que é o foodlilly</h2>
      <p>
        O foodlilly ajuda você a calcular custos, margens e preços de venda a
        partir das informações que você cadastra (insumos, receitas, custos
        fixos, mão de obra e taxas). Os resultados são estimativas baseadas
        nesses dados: a decisão final sobre preços é sempre sua.
      </p>

      <h2>2. Sua conta</h2>
      <ul>
        <li>
          Você deve informar dados verdadeiros e mantê-los atualizados no seu
          Perfil.
        </li>
        <li>
          O login e a senha são pessoais. Você é responsável pelo que for feito
          com a sua conta.
        </li>
        <li>Se perceber um uso indevido, altere a senha e fale com a gente.</li>
      </ul>

      <h2>3. Teste grátis e planos</h2>
      <ul>
        <li>
          Toda conta nova tem {DIAS_TESTE_GRATIS} dias de teste grátis, sem
          cartão de crédito.
        </li>
        <li>
          No fim do teste, o acesso fica bloqueado até a contratação de um
          plano. Nenhuma cobrança é feita automaticamente.
        </li>
        <li>
          Os planos são mensais e pagos por Pix. O pagamento libera o acesso até
          a data de vencimento informada na tela de Assinatura.
        </li>
        <li>
          Não há fidelidade: se não renovar, o acesso fica bloqueado e seus
          dados continuam guardados por um período, conforme a Política de
          Privacidade.
        </li>
        <li>
          Preços e itens dos planos podem mudar. Mudanças valem para os períodos
          seguintes e serão avisadas com antecedência.
        </li>
      </ul>

      <h2>4. Uso permitido</h2>
      <p>
        Você se compromete a não usar o foodlilly para atividades ilegais, não
        tentar acessar dados de outras pessoas e não prejudicar o funcionamento
        do sistema.
      </p>

      <h2>5. Seus dados</h2>
      <p>
        As informações que você cadastra continuam sendo suas. Usamos esses
        dados apenas para fazer o sistema funcionar, como descrito na{" "}
        <Link
          href="/privacidade"
          className="font-medium text-primary underline"
        >
          Política de Privacidade
        </Link>
        .
      </p>

      <h2>6. Disponibilidade</h2>
      <p>
        Trabalhamos para manter o sistema disponível e seguro, mas podem
        acontecer interrupções para manutenção ou por falhas de terceiros
        (internet, hospedagem). Recomendamos guardar cópias dos relatórios
        importantes.
      </p>

      <h2>7. Responsabilidade</h2>
      <p>
        O foodlilly não se responsabiliza por decisões de negócio tomadas com
        base em dados cadastrados de forma incorreta ou incompleta, nem por
        prejuízos indiretos decorrentes do uso do sistema.
      </p>

      <h2>8. Cancelamento</h2>
      <p>
        Você pode deixar de usar o foodlilly a qualquer momento. Podemos
        suspender contas que descumprirem estes termos.
      </p>

      <h2>9. Alterações</h2>
      <p>
        Estes termos podem ser atualizados. A data da última atualização aparece
        no topo desta página, e mudanças importantes serão avisadas dentro do
        sistema.
      </p>

      <h2>10. Lei aplicável</h2>
      <p>
        Estes termos seguem as leis do Brasil, incluindo o Código de Defesa do
        Consumidor e a Lei Geral de Proteção de Dados (LGPD).
      </p>
    </PaginaLegal>
  );
}
