import { withSession } from "@/app/api/with-auth";

export const dynamic = "force-dynamic";

const HTTP_NO_CONTENT = 204;

export const POST = withSession(async (_request, { session, container }) => {
  await container.typing.signal(session.user.id);

  return new Response(null, { status: HTTP_NO_CONTENT });
});
