import { withSession } from "@/app/api/with-auth";

export const dynamic = "force-dynamic";

export const GET = withSession((_request, { session }) =>
  Promise.resolve(Response.json({ user: session.user })),
);
