import { getContainer } from "@/server/container";
import { endSession } from "@/server/session";

export const dynamic = "force-dynamic";

const HTTP_NO_CONTENT = 204;

export async function POST(): Promise<Response> {
  const { auth } = await getContainer();

  await endSession(auth);

  return new Response(null, { status: HTTP_NO_CONTENT });
}
