import { toDraftStatusDto, toTicketDto } from "@/app/api/dto";
import { withSession } from "@/app/api/with-auth";

export const dynamic = "force-dynamic";

interface DraftParams {
  id: string;
}

export const POST = withSession<DraftParams>(async (_request, { session, container, params }) => {
  const { id } = await params;
  const { draft, ticket } = await container.chat.drafts.confirm(session.user.id, id);

  return Response.json({ draft: toDraftStatusDto(draft), ticket: toTicketDto(ticket) });
});
