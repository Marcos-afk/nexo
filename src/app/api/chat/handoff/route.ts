import { withSession } from "@/app/api/with-auth";

export const dynamic = "force-dynamic";

export const POST = withSession(async (_request, { session, container }) => {
  const conversation = await container.chat.handoff.requestOnLimit(session.user.id);

  return Response.json({ mode: conversation.mode });
});
