import type { ReactNode } from "react";

interface AuthSectionProps {
  readonly children: ReactNode;
}

export function AuthSection({ children }: AuthSectionProps) {
  return (
    <section className="flex min-w-0 flex-1 flex-col justify-between px-6 py-10 lg:px-14">
      <p className="flex justify-end gap-1.5 text-sm text-ink-3">
        Problema para entrar?
        <span className="font-semibold text-primary-text">Ligue no ramal 4000</span>
      </p>
      <div className="flex justify-center">{children}</div>
      <p className="text-xs text-ink-3">© 2026 Nexo · Service desk de TI</p>
    </section>
  );
}
