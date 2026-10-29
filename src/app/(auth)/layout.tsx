import type { ReactNode } from "react";

interface AuthLayoutProps {
  readonly children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <main className="flex min-h-screen bg-paper">{children}</main>;
}
