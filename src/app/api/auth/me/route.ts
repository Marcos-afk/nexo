import { respondWith } from "@/app/api/error-response";
import { getContainer } from "@/server/container";
import { requireSession } from "@/server/session";

export const dynamic = "force-dynamic";

export const GET = (): Promise<Response> =>
  respondWith(async () => {
    const { auth } = await getContainer();
    const session = await requireSession(auth);

    return Response.json({ user: session.user });
  });
