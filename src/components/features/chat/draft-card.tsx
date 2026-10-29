import { Skeleton } from "@/components/ui/skeleton";
import type { DraftProps } from "@/models/draft";
import { useDraftCard } from "@/viewmodels/use-draft-card";
import { DraftActions } from "./draft-actions";
import { DraftEditForm } from "./draft-edit-form";
import { DraftNoteForm } from "./draft-note-form";
import { DraftSummary } from "./draft-summary";

const CARD_CLASS = "w-full max-w-150 rounded-2xl border border-ink/10 bg-paper";

type DraftCardState = ReturnType<typeof useDraftCard>;

interface DraftBodyProps {
  readonly card: DraftCardState;
  readonly draft: DraftProps;
}

function DraftBody({ card, draft }: DraftBodyProps) {
  if (!card.isEditing) {
    return <DraftSummary draft={draft} />;
  }

  return draft.ticket ? (
    <DraftEditForm
      ticket={draft.ticket}
      error={card.actionError}
      onSave={card.onSaveTicket}
      onCancel={card.onStopEdit}
    />
  ) : (
    <DraftNoteForm
      note={draft.note ?? ""}
      error={card.actionError}
      onSave={card.onSaveNote}
      onCancel={card.onStopEdit}
    />
  );
}

interface DraftCardProps {
  readonly draftId: string;
}

export function DraftCard({ draftId }: DraftCardProps) {
  const card = useDraftCard(draftId);
  const { draft } = card;

  if (card.loadError) {
    return (
      <p role="alert" className={`${CARD_CLASS} px-4.5 py-4 text-sm text-danger-text`}>
        {card.loadError}
      </p>
    );
  }

  if (draft === null) {
    return <Skeleton className="h-44 w-full max-w-150 rounded-2xl" />;
  }

  return (
    <article aria-label="Rascunho de chamado" className={CARD_CLASS}>
      <DraftBody card={card} draft={draft} />
      {card.isPending && !card.isEditing && (
        <DraftActions
          canEdit={draft.mode !== "reopen"}
          isWorking={card.isWorking}
          shortcutLabel={card.shortcutLabel}
          error={card.actionError}
          onConfirm={card.onConfirm}
          onEdit={card.onStartEdit}
          onCancel={card.onCancel}
        />
      )}
    </article>
  );
}
