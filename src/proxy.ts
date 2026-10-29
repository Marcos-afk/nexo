import { type NextRequest, NextResponse } from "next/server";
import { HOME_PATH, LOGIN_PATH } from "./constants/routes";
import { SESSION_COOKIE } from "./server/session-cookie";

const redirectTargetOf = (isLoginPath: boolean, hasSession: boolean): string | null => {
  if (isLoginPath && hasSession) {
    return HOME_PATH;
  }

  return !isLoginPath && !hasSession ? LOGIN_PATH : null;
};

export const proxy = (request: NextRequest): NextResponse => {
  const target = redirectTargetOf(
    request.nextUrl.pathname === LOGIN_PATH,
    request.cookies.has(SESSION_COOKIE),
  );

  return target === null
    ? NextResponse.next()
    : NextResponse.redirect(new URL(target, request.url));
};

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
