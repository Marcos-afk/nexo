export const ticketCategories = [
  "Acesso",
  "Rede e VPN",
  "Hardware",
  "Software",
  "E-mail",
  "Outros",
] as const;

export type TicketCategory = (typeof ticketCategories)[number];
