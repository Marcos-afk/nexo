import { notFound } from "next/navigation";
import { toConsoleConversationDto } from "@/app/api/dto";
import { ConversationView } from "@/components/features/console/conversation-view";
import { ConversationNotFoundError } from "@/domain/errors";
import type { ConsoleConversationProps } from "@/models/console";
import { getContainer } from "@/server/container";
import { findSession } from "@/server/session";

interface ConversationPageProps {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{ decision?: string }>;
}

async function fetchConversation(id: string): Promise<ConsoleConversationProps | null> {
  const { auth, console: consoleService } = await getContainer();
  const session = await findSession(auth);

  if (!session) {
    return null;
  }

  try {
    return toConsoleConversationDto(await consoleService.getConversation(session.user.id, id));
  } catch (error) {
    if (error instanceof ConversationNotFoundError) {
      return null;
    }

    throw error;
  }
}

export default async function ConsoleConversation({ params, searchParams }: ConversationPageProps) {
  const [{ id }, { decision }] = await Promise.all([params, searchParams]);
  const conversation = await fetchConversation(id);

  if (!conversation) {
    notFound();
  }

  return (
    <ConversationView
      key={conversation.id}
      initial={conversation}
      decisionMessageId={decision ?? null}
    />
  );
}
