import { withSession } from "@/app/api/with-auth";

export const dynamic = "force-dynamic";

export const POST = withSession(async (_request, { session, container }) => {
  await container.auth.requestPasswordReset(session.user.id);

  return Response.json({ requested: true });
});
