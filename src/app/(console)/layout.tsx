import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Rail } from "@/components/layouts/console/rail";
import { ConsoleEventsProvider } from "@/providers/console-events-provider";
import { ConsoleStateProvider } from "@/providers/console-state-provider";
import { getContainer } from "@/server/container";
import { findSession } from "@/server/session";
import type { ConsoleOverview } from "@/services/console/console-service";

interface ConsoleLayoutProps {
  readonly children: ReactNode;
}

async function fetchConsoleOverview(): Promise<ConsoleOverview | null> {
  const { auth, console: consoleService } = await getContainer();
  const session = await findSession(auth);

  return session?.user.role === "analyst" ? consoleService.list(session.user.id) : null;
}

export default async function ConsoleLayout({ children }: ConsoleLayoutProps) {
  const overview = await fetchConsoleOverview();

  if (!overview) {
    notFound();
  }

  return (
    <ConsoleStateProvider initialAttention={overview.attention}>
      <ConsoleEventsProvider>
        <div className="flex h-screen overflow-hidden bg-paper">
          <Rail me={overview.me} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </ConsoleEventsProvider>
    </ConsoleStateProvider>
  );
}
