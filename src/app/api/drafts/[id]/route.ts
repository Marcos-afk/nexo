import { toDraftDto } from "@/app/api/dto";
import { withSession } from "@/app/api/with-auth";
import { draftInputSchema } from "@/domain/draft";

export const dynamic = "force-dynamic";

const HTTP_BAD_REQUEST = 400;
const INVALID_DRAFT_MESSAGE = "Os dados do rascunho estão incompletos ou inválidos.";

interface DraftParams {
  id: string;
}

export const GET = withSession<DraftParams>(async (_request, { session, container, params }) => {
  const { id } = await params;
  const details = await container.chat.drafts.get(session.user.id, id);

  return Response.json({ draft: toDraftDto(details) });
});

export const PATCH = withSession<DraftParams>(async (request, { session, container, params }) => {
  const input = draftInputSchema.safeParse(await request.json().catch(() => null));

  if (!input.success) {
    const fields = input.error.issues.map((issue) => issue.path.join("."));

    return Response.json({ error: INVALID_DRAFT_MESSAGE, fields }, { status: HTTP_BAD_REQUEST });
  }

  const { id } = await params;
  const details = await container.chat.drafts.edit(session.user.id, id, input.data);

  return Response.json({ draft: toDraftDto(details) });
});
