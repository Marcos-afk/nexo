import { withAnalyst } from "@/app/api/with-auth";

export const dynamic = "force-dynamic";

interface ConversationParams {
  id: string;
}

export const POST = withAnalyst<ConversationParams>(
  async (_request, { session, container, params }) => {
    const { id } = await params;
    const conversation = await container.chat.handoff.returnToAgent(session.user.id, id);

    return Response.json({ mode: conversation.mode });
  },
);
