import type { ReactNode } from "react";
import { toConsoleDto } from "@/app/api/dto";
import { ConsoleList } from "@/components/features/console/console-list";
import type { ConsoleProps } from "@/models/console";
import { getContainer } from "@/server/container";
import { findSession } from "@/server/session";

interface ConsoleListLayoutProps {
  readonly children: ReactNode;
}

async function fetchConsole(): Promise<ConsoleProps | null> {
  const { auth, console: consoleService } = await getContainer();
  const session = await findSession(auth);

  return session ? toConsoleDto(await consoleService.list(session.user.id)) : null;
}

export default async function ConsoleListLayout({ children }: ConsoleListLayoutProps) {
  const initial = await fetchConsole();

  return (
    <div className="flex h-full">
      {initial && <ConsoleList initial={initial} />}
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
