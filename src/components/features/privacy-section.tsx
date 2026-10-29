import type { PrivacySectionProps } from "@/models/privacy";

interface PrivacySectionViewProps {
  readonly section: PrivacySectionProps;
}

export function PrivacySection({ section }: PrivacySectionViewProps) {
  const headingId = `privacy-${section.id}`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="text-lg font-semibold tracking-tight text-ink">
        {section.title}
      </h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-relaxed text-ink-2">
          {paragraph}
        </p>
      ))}
      {section.items.length > 0 && (
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-ink-2">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
