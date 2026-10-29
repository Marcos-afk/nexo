import { toConsoleDto } from "@/app/api/dto";
import { ConsolePanel } from "@/components/features/console/console-panel";
import type { ConsoleProps } from "@/models/console";
import { getContainer } from "@/server/container";
import { findSession } from "@/server/session";

async function fetchConsole(): Promise<ConsoleProps | null> {
  const { auth, console: consoleService } = await getContainer();
  const session = await findSession(auth);

  return session ? toConsoleDto(await consoleService.list(session.user.id)) : null;
}

export default async function Console() {
  const initial = await fetchConsole();

  return initial && <ConsolePanel initial={initial} />;
}
