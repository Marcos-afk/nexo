import { type NextRequest, NextResponse } from "next/server";
import { GUEST_ONLY_PATHS, HOME_PATH, LOGIN_PATH, PUBLIC_PATHS } from "./constants/routes";
import { SESSION_COOKIE } from "./server/session-cookie";

const redirectTargetOf = (pathname: string, hasSession: boolean): string | null => {
  if (PUBLIC_PATHS.has(pathname)) {
    return null;
  }

  const isGuestOnly = GUEST_ONLY_PATHS.has(pathname);

  if (isGuestOnly && hasSession) {
    return HOME_PATH;
  }

  return !isGuestOnly && !hasSession ? LOGIN_PATH : null;
};

export const proxy = (request: NextRequest): NextResponse => {
  const target = redirectTargetOf(request.nextUrl.pathname, request.cookies.has(SESSION_COOKIE));

  return target === null
    ? NextResponse.next()
    : NextResponse.redirect(new URL(target, request.url));
};

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
