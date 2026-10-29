import { withSession } from "@/app/api/with-auth";
import { createEventStream, parseLastEventId, SSE_HEADERS } from "@/server/sse";

export const dynamic = "force-dynamic";

const LAST_EVENT_ID_HEADER = "Last-Event-ID";

export const GET = withSession((request, { container, session }) =>
  Promise.resolve(
    new Response(
      createEventStream({
        bus: container.events,
        audience: { id: session.user.id, role: session.user.role },
        lastEventId: parseLastEventId(request.headers.get(LAST_EVENT_ID_HEADER)),
        signal: request.signal,
      }),
      { headers: SSE_HEADERS },
    ),
  ),
);
