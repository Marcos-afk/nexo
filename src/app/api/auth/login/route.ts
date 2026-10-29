import { z } from "zod";
import { respondWith } from "@/app/api/error-response";
import { getContainer } from "@/server/container";
import { startSessionCookie } from "@/server/session";

export const dynamic = "force-dynamic";

const HTTP_BAD_REQUEST = 400;
const INVALID_LOGIN_MESSAGE = "Informe um e-mail corporativo válido e a senha.";

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  remember: z.boolean().default(true),
});

export async function POST(request: Request): Promise<Response> {
  const body = bodySchema.safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return Response.json({ error: INVALID_LOGIN_MESSAGE }, { status: HTTP_BAD_REQUEST });
  }

  return respondWith(async () => {
    const { auth } = await getContainer();
    const session = await auth.login({ email: body.data.email, remember: body.data.remember });

    await startSessionCookie(session);

    return Response.json({ user: session.user });
  });
}
