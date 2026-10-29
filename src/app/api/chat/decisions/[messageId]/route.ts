import { toDecisionDto } from "@/app/api/dto";
import { withSession } from "@/app/api/with-auth";

export const dynamic = "force-dynamic";

interface DecisionParams {
  messageId: string;
}

export const GET = withSession<DecisionParams>(async (_request, { session, container, params }) => {
  const { messageId } = await params;
  const decision = await container.chat.decisions.getForMessage(session.user.id, messageId);

  return Response.json({ decision: toDecisionDto(decision) });
});
