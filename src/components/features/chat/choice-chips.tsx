import { cx } from "class-variance-authority";
import { Check } from "lucide-react";

const ICON_SIZE = 14;

interface ChoiceChipsProps {
  readonly options: readonly string[];
  readonly answer: string | null;
  readonly isDisabled: boolean;
  readonly onSelect: (text: string) => void;
}

export function ChoiceChips({ options, answer, isDisabled, onSelect }: ChoiceChipsProps) {
  const isAnswered = answer !== null;

  return (
    <fieldset className="m-0 flex min-w-0 flex-wrap gap-1.5 border-0 p-0">
      <legend className="sr-only">Respostas rápidas</legend>
      {options.map((option) => {
        const isChosen = answer === option;

        return (
          <button
            key={option}
            type="button"
            disabled={isAnswered || isDisabled}
            aria-pressed={isChosen}
            onClick={() => onSelect(option)}
            className={cx(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.75 text-sm font-medium transition disabled:cursor-not-allowed",
              isChosen
                ? "border-primary bg-primary-soft text-primary-text"
                : "border-rule bg-paper text-ink enabled:hover:bg-card disabled:opacity-60",
            )}
          >
            {isChosen && <Check size={ICON_SIZE} aria-hidden="true" />}
            {option}
          </button>
        );
      })}
    </fieldset>
  );
}
