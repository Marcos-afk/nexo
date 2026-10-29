import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PrivacySection } from "@/components/features/privacy-section";
import { NexoMark } from "@/components/ui/nexo-mark";
import { PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_TITLE } from "@/constants/privacy";
import { HOME_PATH } from "@/constants/routes";

export const metadata: Metadata = { title: `${PRIVACY_TITLE} · Nexo Assist` };

export default function Privacy() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <Link
        href={HOME_PATH}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar
      </Link>
      <header className="flex flex-col gap-3">
        <NexoMark className="text-primary" />
        <h1 className="font-display text-4xl leading-tight tracking-tight text-ink">
          {PRIVACY_TITLE}
        </h1>
        <p className="text-sm leading-relaxed text-ink-2">{PRIVACY_INTRO}</p>
      </header>
      {PRIVACY_SECTIONS.map((section) => (
        <PrivacySection key={section.id} section={section} />
      ))}
    </div>
  );
}
