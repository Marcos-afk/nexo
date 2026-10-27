export interface HelpArticle {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
}

export const helpArticles: readonly HelpArticle[] = [
  {
    id: "kb-vpn-809",
    title: "VPN com erro 809",
    body: "Reinstale o cliente de VPN pelo portal de softwares e reinicie o computador. Vale apenas para Windows 10; no Windows 11, abra um chamado.",
    tags: ["vpn", "erro 809", "rede", "windows 10", "windows 11"],
  },
  {
    id: "kb-service-desk-hours",
    title: "Horário do service desk",
    body: "De segunda a sexta, das 8h às 18h. Chamados críticos têm plantão 24 horas.",
    tags: ["horario", "atendimento", "plantao", "service desk"],
  },
  {
    id: "kb-wifi-password",
    title: "Senha do Wi-Fi corporativo",
    body: "A senha do Wi-Fi corporativo é enviada ao e-mail corporativo pelo portal de acessos, na opção Rede sem fio. O envio leva até 5 minutos.",
    tags: ["wifi", "senha", "rede", "acesso"],
  },
];
