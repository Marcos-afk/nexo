import { AnalystRequiredError } from "@/domain/errors";
import { type Container, getContainer } from "@/server/container";
import { requireSession } from "@/server/session";
import type { AuthSession } from "@/services/auth/auth-service";
import { respondWith } from "./error-response";

export interface AuthenticatedContext<TParams> {
  readonly session: AuthSession;
  readonly container: Container;
  readonly params: Promise<TParams>;
}

interface RouteContext<TParams> {
  readonly params: Promise<TParams>;
}

type AuthenticatedHandler<TParams> = (
  request: Request,
  context: AuthenticatedContext<TParams>,
) => Promise<Response>;

type RouteHandler<TParams> = (
  request: Request,
  routeContext: RouteContext<TParams>,
) => Promise<Response>;

const guardedBy =
  <TParams>(isAllowed: (session: AuthSession) => boolean, handler: AuthenticatedHandler<TParams>) =>
  (request: Request, routeContext: RouteContext<TParams>): Promise<Response> =>
    respondWith(async () => {
      const container = await getContainer();
      const session = await requireSession(container.auth);

      if (!isAllowed(session)) {
        throw new AnalystRequiredError();
      }

      return handler(request, {
        session,
        container,
        params: routeContext.params,
      });
    });

const anyUser = (): boolean => true;

const isAnalyst = ({ user }: AuthSession): boolean => user.role === "analyst";

export const withSession = <TParams = Record<string, never>>(
  handler: AuthenticatedHandler<TParams>,
): RouteHandler<TParams> => guardedBy(anyUser, handler);

export const withAnalyst = <TParams = Record<string, never>>(
  handler: AuthenticatedHandler<TParams>,
): RouteHandler<TParams> => guardedBy(isAnalyst, handler);
