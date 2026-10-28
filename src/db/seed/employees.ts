import type { employees } from "../schema";

type NewEmployee = typeof employees.$inferInsert;

const buildEmployee = (id: string, name: string, department: string): NewEmployee => ({
  id,
  name,
  email: `${id.replace("emp-", "")}@nexo.test`,
  department,
  role: "employee",
});

export const seedEmployees: readonly NewEmployee[] = [
  buildEmployee("emp-ana", "Ana Souza", "Financeiro"),
  buildEmployee("emp-carla", "Carla Mendes", "Controladoria"),
  buildEmployee("emp-bruno", "Bruno Tavares", "Logística"),
  buildEmployee("emp-diego", "Diego Ramos", "Operações"),
  buildEmployee("emp-elisa", "Elisa Prado", "Recursos Humanos"),
  buildEmployee("emp-fabio", "Fábio Nunes", "Compras"),
  buildEmployee("emp-gabriela", "Gabriela Rocha", "Marketing"),
  {
    id: "analyst-rafael",
    name: "Rafael Lima",
    email: "rafael@nexo.test",
    department: "Service Desk",
    role: "analyst",
    level: "N2",
    availability: "online",
  },
];
