// Texto do Termo de Uso e da Política de Privacidade (LGPD - Lei 13.709/2018).
// Exibido no cadastro (aceite obrigatório) e no Perfil (consulta).
// O conteúdo descreve o que o app realmente faz: se o código mudar, revise este texto.

export const TERMS_VERSION = '1.0';
export const TERMS_UPDATED_AT = '24/11/2026';

export interface TermsSection {
  title: string;
  paragraphs: string[];
}

export const termsSections: TermsSection[] = [
  {
    title: '1. Sobre o TrendLab',
    paragraphs: [
      'O TrendLab é um protótipo acadêmico de e-commerce de moda acessível, desenvolvido por João Teixeira Duarte Neto (Centro Universitário CESMAC).',
      'Os pedidos são simulados: nenhuma cobrança é realizada e nenhum produto é enviado.',
    ],
  },
  {
    title: '2. Quais dados coletamos',
    paragraphs: [
      'Cadastro: nome, e-mail e senha. A senha é guardada apenas como hash criptográfico, nunca em texto puro.',
      'Pedidos: nome do destinatário, CEP, endereço, forma de pagamento simulada, itens e valor do pedido.',
      'Apenas no seu aparelho: foto de perfil, medidas do provador virtual (altura, peso e preferência de caimento) e preferências de acessibilidade.',
      'Localização: se você usar o GPS no checkout, ela serve só para preencher o endereço e não é guardada pelo app.',
    ],
  },
  {
    title: '3. Onde os dados ficam salvos',
    paragraphs: [
      'No servidor: o banco de dados SQLite da API do TrendLab guarda sua conta (nome, e-mail, senha em hash e data do aceite deste termo) e seus pedidos. Quando a API está publicada, ela roda no serviço de hospedagem Render.',
      'No aparelho: o token de sessão fica no armazenamento seguro do sistema (SecureStore); o histórico de pedidos em cache, a foto de perfil e as medidas do provador ficam no armazenamento local do app (AsyncStorage).',
      'A sacola de compras fica somente na memória do app, enquanto ele está aberto.',
    ],
  },
  {
    title: '4. Para que usamos seus dados',
    paragraphs: [
      'Criar e autenticar sua conta, registrar seus pedidos simulados, sugerir tamanhos no provador virtual e lembrar suas preferências de acessibilidade.',
      'O TrendLab não vende seus dados, não os usa para publicidade e não os compartilha com terceiros, exceto o serviço de hospedagem necessário para a API funcionar.',
    ],
  },
  {
    title: '5. Seus direitos',
    paragraphs: [
      'Acesso: consulte seus pedidos na aba Perfil.',
      'Correção: edite nome do destinatário, CEP, endereço e pagamento de um pedido no Perfil.',
      'Exclusão: use "Excluir minha conta" no Perfil. Isso apaga sua conta e todos os seus pedidos do servidor e remove os dados guardados neste aparelho.',
      'Revogação do consentimento: ao excluir a conta, o consentimento dado neste termo deixa de valer e seus dados são removidos.',
    ],
  },
  {
    title: '6. Por quanto tempo guardamos',
    paragraphs: [
      'Seus dados ficam guardados enquanto sua conta existir. A sessão no aplicativo expira após 1 hora, e você precisa entrar novamente.',
    ],
  },
  {
    title: '7. Consentimento',
    paragraphs: [
      'Ao marcar a caixa de aceite no cadastro, você declara que leu e concorda com este termo. A data e a hora do aceite ficam registradas na sua conta.',
      'Dúvidas ou solicitações sobre seus dados: fale com o desenvolvedor responsável pelo projeto.',
    ],
  },
];
