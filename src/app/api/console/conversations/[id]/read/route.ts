import { withAnalyst } from "@/app/api/with-auth";

export const dynamic = "force-dynamic";

const HTTP_NO_CONTENT = 204;

interface ConversationParams {
  id: string;
}

export const POST = withAnalyst<ConversationParams>(
  async (_request, { session, container, params }) => {
    const { id } = await params;

    await container.console.markRead(session.user.id, id);

    return new Response(null, { status: HTTP_NO_CONTENT });
  },
);
