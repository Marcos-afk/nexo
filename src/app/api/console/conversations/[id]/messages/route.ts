import { withAnalyst } from "@/app/api/with-auth";
import { replyBodySchema } from "@/schemas/console";

export const dynamic = "force-dynamic";

const HTTP_BAD_REQUEST = 400;
const HTTP_CREATED = 201;
const INVALID_REPLY_MESSAGE = "Escreva uma resposta de até 2000 caracteres.";

interface ConversationParams {
  id: string;
}

export const POST = withAnalyst<ConversationParams>(
  async (request, { session, container, params }) => {
    const body = replyBodySchema.safeParse(await request.json().catch(() => null));

    if (!body.success) {
      return Response.json({ error: INVALID_REPLY_MESSAGE }, { status: HTTP_BAD_REQUEST });
    }

    const { id } = await params;
    const message = await container.chat.handoff.reply(session.user.id, id, body.data.content);

    return Response.json({ message: { id: message.id } }, { status: HTTP_CREATED });
  },
);
