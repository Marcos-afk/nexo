import type { employees } from "../schema";

type NewEmployee = typeof employees.$inferInsert;

const buildEmployee = (
  id: string,
  name: string,
  department: string,
  passwordChangedAt: string,
): NewEmployee => ({
  id,
  name,
  email: `${id.replace("emp-", "")}@nexo.test`,
  department,
  role: "employee",
  passwordChangedAt: new Date(passwordChangedAt),
});

export const seedEmployees: readonly NewEmployee[] = [
  buildEmployee("emp-ana", "Ana Souza", "Financeiro", "2026-09-17T09:00:00-03:00"),
  buildEmployee("emp-carla", "Carla Mendes", "Controladoria", "2026-08-03T14:30:00-03:00"),
  buildEmployee("emp-bruno", "Bruno Tavares", "Logística", "2026-10-20T08:15:00-03:00"),
  buildEmployee("emp-diego", "Diego Ramos", "Operações", "2026-06-12T10:00:00-03:00"),
  buildEmployee("emp-elisa", "Elisa Prado", "Recursos Humanos", "2026-09-29T16:45:00-03:00"),
  buildEmployee("emp-fabio", "Fábio Nunes", "Compras", "2026-07-21T11:20:00-03:00"),
  buildEmployee("emp-gabriela", "Gabriela Rocha", "Marketing", "2026-10-05T13:00:00-03:00"),
  {
    id: "analyst-rafael",
    name: "Rafael Lima",
    email: "rafael@nexo.test",
    department: "Service Desk",
    role: "analyst",
    level: "N2",
    availability: "online",
    passwordChangedAt: new Date("2026-10-01T09:30:00-03:00"),
  },
];
