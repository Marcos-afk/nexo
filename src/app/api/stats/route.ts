import { respondWith } from "@/app/api/error-response";
import { getContainer } from "@/server/container";

export const dynamic = "force-dynamic";

const CACHE_CONTROL = "public, max-age=30";

export const GET = (): Promise<Response> =>
  respondWith(async () => {
    const { stats } = await getContainer();

    return Response.json(
      { stats: await stats.loginStats() },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  });
