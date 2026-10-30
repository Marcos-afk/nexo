import Link from "next/link";
import type { ReactNode } from "react";
import { PRIVACY_PATH } from "@/constants/routes";

interface AuthSectionProps {
  readonly children: ReactNode;
}

export function AuthSection({ children }: AuthSectionProps) {
  return (
    <section className="flex min-w-0 flex-1 flex-col justify-between px-6 py-10 lg:px-14">
      <p className="flex justify-end gap-1.5 text-[13.5px] text-ink-3">
        Problema para entrar?
        <span className="font-semibold text-primary-text">Ligue no ramal 4000</span>
      </p>
      <div className="flex justify-center">{children}</div>
      <p className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-ink-3">
        <span>© 2026 Nexo · Service desk de TI</span>
        <Link href={PRIVACY_PATH} className="hover:text-ink">
          Privacidade e uso de dados
        </Link>
      </p>
    </section>
  );
}
