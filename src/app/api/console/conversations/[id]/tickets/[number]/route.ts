import { toConsoleTicketDetailDto } from "@/app/api/dto";
import { withAnalyst } from "@/app/api/with-auth";

export const dynamic = "force-dynamic";

interface TicketParams {
  id: string;
  number: string;
}

export const GET = withAnalyst<TicketParams>(async (_request, { session, container, params }) => {
  const { id, number } = await params;
  const detail = await container.console.getTicket(session.user.id, id, number);

  return Response.json({ detail: toConsoleTicketDetailDto(detail) });
});
