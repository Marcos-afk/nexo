import { forgotPasswordSchema } from "@/schemas/auth";

export const dynamic = "force-dynamic";

const HTTP_BAD_REQUEST = 400;
const INVALID_EMAIL_MESSAGE = "Informe um e-mail corporativo válido.";

export async function POST(request: Request): Promise<Response> {
  const body = forgotPasswordSchema.safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return Response.json({ error: INVALID_EMAIL_MESSAGE }, { status: HTTP_BAD_REQUEST });
  }

  return Response.json({ requested: true });
}
