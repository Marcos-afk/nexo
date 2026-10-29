import type { ReactNode } from "react";
import { Sidebar } from "@/components/layouts/sidebar";
import { TopBar } from "@/components/layouts/top-bar";
import type { AssistantStatus } from "@/domain/health";
import type { AuthUserProps } from "@/models/auth";
import { AssistantStatusProvider } from "@/providers/assistant-status-provider";
import { getContainer } from "@/server/container";
import { findSession } from "@/server/session";

interface AppLayoutProps {
  readonly children: ReactNode;
}

async function fetchSessionUser(): Promise<AuthUserProps | null> {
  const { auth } = await getContainer();
  const session = await findSession(auth);

  return session ? session.user : null;
}

async function fetchAssistantStatus(): Promise<AssistantStatus> {
  const { health } = await getContainer();

  return health().status;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const [user, assistantStatus] = await Promise.all([fetchSessionUser(), fetchAssistantStatus()]);

  return (
    <AssistantStatusProvider initialStatus={assistantStatus}>
      <div className="flex h-screen overflow-hidden bg-paper">
        <Sidebar user={user} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </AssistantStatusProvider>
  );
}
