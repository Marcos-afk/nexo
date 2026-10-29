import { toConversationTicketsDto } from "@/app/api/dto";
import { withAnalyst } from "@/app/api/with-auth";

export const dynamic = "force-dynamic";

interface ConversationParams {
  id: string;
}

export const GET = withAnalyst<ConversationParams>(
  async (_request, { session, container, params }) => {
    const { id } = await params;
    const tickets = await container.console.listTickets(session.user.id, id);

    return Response.json({ tickets: toConversationTicketsDto(tickets) });
  },
);
