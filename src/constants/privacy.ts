import type { PrivacySectionProps } from "@/models/privacy";

export const PRIVACY_TITLE = "Privacidade e uso de dados";

export const PRIVACY_INTRO =
  "O Nexo Assist é o assistente do service desk de TI. Esta página explica, em poucas linhas, o que fica guardado quando você conversa com ele e quem pode ver cada coisa.";

export const PRIVACY_SECTIONS: readonly PrivacySectionProps[] = [
  {
    id: "stored",
    title: "O que guardamos",
    paragraphs: [],
    items: [
      "As mensagens da sua conversa com o Nexo e as respostas do assistente.",
      "Os rascunhos e os chamados que você abre, atualiza ou reabre por aqui.",
      "O registro de como o assistente decidiu cada resposta (o que entendeu, que ferramentas usou e o grau de confiança), para o time de TI conferir.",
      "Sua sessão de acesso: um cookie próprio que identifica você enquanto está conectado.",
    ],
  },
  {
    id: "visibility",
    title: "Quem vê o quê",
    paragraphs: [],
    items: [
      "Cada funcionário vê apenas as próprias conversas, rascunhos e chamados. Nada de outra pessoa aparece na sua tela, mesmo que você cite o nome ou o número de um chamado que não é seu.",
      "Os analistas do service desk acessam a conversa quando ela é transferida para o suporte, para poder atender o seu pedido.",
    ],
  },
  {
    id: "model",
    title: "O que vai para o modelo de inteligência artificial",
    paragraphs: [
      "Para responder, o texto das suas mensagens e os dados dos seus chamados que a resposta precisa são enviados ao modelo de linguagem do assistente (Google Gemini).",
      "Por isso, não escreva senhas, números de documentos nem dados pessoais de outras pessoas no chat.",
    ],
    items: [],
  },
  {
    id: "session",
    title: "Sessão e cookies",
    paragraphs: [
      "Ao entrar, o Nexo guarda um cookie de sessão que os scripts da página não conseguem ler.",
      'Com a opção "Manter conectado neste computador" marcada, a sessão dura 30 dias. Sem ela, termina quando você fecha o navegador, com limite de 12 horas.',
    ],
    items: [],
  },
  {
    id: "demo",
    title: "Esta é uma demonstração",
    paragraphs: [
      "O login aceita qualquer senha e a redefinição de senha é simulada: nenhuma senha é verificada nem guardada e nenhum e-mail é enviado.",
      "Os funcionários, os chamados e as conversas de exemplo são fictícios.",
    ],
    items: [],
  },
];
