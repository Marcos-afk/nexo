import { withSession } from "@/app/api/with-auth";

export const dynamic = "force-dynamic";

const CACHE_CONTROL = "no-store";

export const GET = withSession((_request, { container }) =>
  Promise.resolve(
    Response.json({ health: container.health() }, { headers: { "Cache-Control": CACHE_CONTROL } }),
  ),
);
