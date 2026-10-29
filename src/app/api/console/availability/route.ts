import { withAnalyst } from "@/app/api/with-auth";
import { availabilityBodySchema } from "@/schemas/console";

export const dynamic = "force-dynamic";

const HTTP_BAD_REQUEST = 400;
const INVALID_AVAILABILITY_MESSAGE = "Informe uma disponibilidade válida.";

export const PATCH = withAnalyst(async (request, { session, container }) => {
  const body = availabilityBodySchema.safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return Response.json({ error: INVALID_AVAILABILITY_MESSAGE }, { status: HTTP_BAD_REQUEST });
  }

  const availability = await container.console.setAvailability(
    session.user.id,
    body.data.availability,
  );

  return Response.json({ availability });
});
