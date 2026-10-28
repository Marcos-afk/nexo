import type { helpArticles } from "../schema";

type NewHelpArticle = typeof helpArticles.$inferInsert;

export const seedArticles: readonly NewHelpArticle[] = [
  {
    id: "kb-vpn-809",
    title: "VPN com erro 809",
    body: "Reinstale o cliente de VPN pelo portal de softwares e reinicie o computador. Vale apenas para Windows 10; no Windows 11, abra um chamado.",
    tags: ["vpn", "erro 809", "rede", "windows 10", "windows 11"],
    conditions: { windowsVersions: ["10"] },
  },
  {
    id: "kb-service-desk-hours",
    title: "Horário do service desk",
    body: "De segunda a sexta, das 8h às 18h. Chamados críticos têm plantão 24 horas.",
    tags: ["horario", "atendimento", "plantao", "service desk"],
    conditions: null,
  },
  {
    id: "kb-wifi-password",
    title: "Senha do Wi-Fi corporativo",
    body: "A senha do Wi-Fi corporativo é enviada ao e-mail corporativo pelo portal de acessos, na opção Rede sem fio. O envio leva até 5 minutos.",
    tags: ["wifi", "senha", "rede", "acesso"],
    conditions: null,
  },
  {
    id: "kb-outlook-sync",
    title: "Outlook não sincroniza no celular",
    body: "Remova a conta do aplicativo, reinicie o celular e adicione a conta novamente com o e-mail corporativo. Se pedir aprovação, confirme no aplicativo autenticador.",
    tags: ["outlook", "email", "celular", "sincronizacao"],
    conditions: null,
  },
  {
    id: "kb-network-password",
    title: "Troca de senha da rede",
    body: "Acesse o portal de acessos, escolha Alterar senha e siga as instruções. A nova senha vale em até 10 minutos em todos os sistemas.",
    tags: ["senha", "rede", "acesso", "troca de senha"],
    conditions: null,
  },
  {
    id: "kb-printer-offline",
    title: "Impressora sem conexão",
    body: "Confira se a impressora está ligada e na mesma rede. No Windows, remova a impressora e adicione de novo pelo portal de softwares. Se persistir, abra um chamado informando o andar e o modelo.",
    tags: ["impressora", "rede", "offline"],
    conditions: null,
  },
  {
    id: "kb-sharepoint-access",
    title: "Acesso a pastas do SharePoint",
    body: "O acesso a pastas do SharePoint é concedido pelo dono da pasta. Abra um pedido informando o endereço da pasta e o nível de acesso necessário.",
    tags: ["sharepoint", "acesso", "pasta", "permissao"],
    conditions: null,
  },
  {
    id: "kb-notebook-slow",
    title: "Notebook lento após atualização do Windows",
    body: "Reinicie o computador e libere espaço em disco. Se a lentidão continuar depois de uma atualização do Windows, abra um chamado de hardware informando o modelo do notebook.",
    tags: ["notebook", "lento", "windows", "atualizacao", "desempenho"],
    conditions: null,
  },
];
