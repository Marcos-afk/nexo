import { toConsoleDto } from "@/app/api/dto";
import { withAnalyst } from "@/app/api/with-auth";
import { consoleQuerySchema } from "@/schemas/console";

export const dynamic = "force-dynamic";

const HTTP_BAD_REQUEST = 400;
const INVALID_QUERY_MESSAGE = "Os filtros informados são inválidos.";

export const GET = withAnalyst(async (request, { session, container }) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = consoleQuerySchema.safeParse(params);

  if (!query.success) {
    return Response.json({ error: INVALID_QUERY_MESSAGE }, { status: HTTP_BAD_REQUEST });
  }

  const overview = await container.console.list(session.user.id, {
    filter: query.data.filter,
    query: query.data.q,
  });

  return Response.json(toConsoleDto(overview));
});
