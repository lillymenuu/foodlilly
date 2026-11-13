import type { Metadata } from "next";

import { PaginaLegal } from "@/components/pagina-legal";

export const metadata: Metadata = {
  title: "Política de Privacidade · foodlilly",
};

export default function Page() {
  return (
    <PaginaLegal
      titulo="Política de Privacidade"
      atualizadoEm="13 de novembro de 2026"
    >
      <p>
        Esta política explica quais dados pessoais o foodlilly coleta, para que
        são usados e quais são os seus direitos, de acordo com a Lei Geral de
        Proteção de Dados (Lei nº 13.709/2018, LGPD).
      </p>

      <h2>1. Dados que coletamos</h2>
      <ul>
        <li>
          <strong>Cadastro:</strong> nome, e-mail, telefone, país, CPF (no
          Brasil), código de indicação (se informado) e a data em que você
          aceitou os termos.
        </li>
        <li>
          <strong>Login com Google:</strong> nome, e-mail e foto do perfil,
          fornecidos pelo Google com a sua autorização.
        </li>
        <li>
          <strong>Dados do negócio:</strong> as informações que você cadastra no
          sistema (insumos, receitas, custos, funcionários, equipamentos e
          preços).
        </li>
        <li>
          <strong>Dados técnicos:</strong> endereço IP, navegador e datas de
          acesso, usados para manter a sua sessão e a segurança da conta.
        </li>
      </ul>

      <h2>2. Para que usamos</h2>
      <ul>
        <li>Criar e manter a sua conta e o seu acesso.</li>
        <li>Fazer os cálculos e relatórios do sistema.</li>
        <li>
          Controlar o teste grátis, os pagamentos e o vencimento do plano.
        </li>
        <li>
          Falar com você sobre a sua conta, o suporte e mudanças importantes.
        </li>
        <li>Prevenir fraudes e proteger a segurança do sistema.</li>
      </ul>

      <h2>3. Com quem compartilhamos</h2>
      <p>
        Não vendemos seus dados. Eles só são compartilhados com serviços
        necessários para o funcionamento do foodlilly:
      </p>
      <ul>
        <li>hospedagem do site e banco de dados (servidores na nuvem);</li>
        <li>Google, quando você escolhe entrar com a conta Google;</li>
        <li>
          a instituição de pagamento que processa o Pix, quando os pagamentos
          forem feitos pelo sistema;
        </li>
        <li>autoridades, quando exigido por lei.</li>
      </ul>

      <h2>4. Segurança</h2>
      <p>
        As senhas são guardadas de forma criptografada e o acesso aos dados de
        cada negócio é restrito ao dono da conta. A comunicação com o site é
        protegida por conexão segura (HTTPS).
      </p>

      <h2>5. Por quanto tempo guardamos</h2>
      <p>
        Mantemos os dados enquanto a conta existir. Se a conta for encerrada, os
        dados são apagados ou anonimizados, exceto o que precisarmos guardar
        para cumprir obrigações legais (por exemplo, registros de pagamento).
      </p>

      <h2>6. Seus direitos</h2>
      <p>Pela LGPD, você pode, a qualquer momento:</p>
      <ul>
        <li>saber quais dados temos sobre você e pedir uma cópia;</li>
        <li>
          corrigir dados incompletos ou desatualizados (a maior parte pode ser
          feita na tela de Perfil);
        </li>
        <li>pedir a exclusão da conta e dos dados;</li>
        <li>revogar o consentimento, como a ligação com a conta Google.</li>
      </ul>

      <h2>7. Cookies</h2>
      <p>
        Usamos apenas os cookies necessários para manter você conectado com
        segurança. Não usamos cookies de publicidade.
      </p>

      <h2>8. Contato</h2>
      <p>
        Para exercer seus direitos ou tirar dúvidas sobre privacidade, fale com
        a gente pelos canais de atendimento informados no sistema.
      </p>

      <h2>9. Alterações</h2>
      <p>
        Esta política pode ser atualizada. A data da última atualização aparece
        no topo desta página.
      </p>
    </PaginaLegal>
  );
}
