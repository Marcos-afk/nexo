import { api } from "@/lib/api";
import type { DraftEditValues, DraftNoteValues, DraftProps } from "@/models/draft";
import {
  confirmDraftResponseSchema,
  draftResponseSchema,
  draftStatusResponseSchema,
} from "@/schemas/draft";
import { type DraftResource, draftPathOf } from "./use-draft-resource";
import { useDraftRunner } from "./use-draft-runner";

interface UseDraftCommandsProps {
  readonly draftId: string;
  readonly resource: DraftResource;
}

export function useDraftCommands({ draftId, resource }: UseDraftCommandsProps) {
  const { draft, setDraft } = resource;
  const { actionError, isWorking, run } = useDraftRunner();
  const path = draftPathOf(draftId);

  const patch = async (body: unknown) => {
    const response = await api.patch(path, body, draftResponseSchema);

    setDraft(response.draft);
  };

  const confirm = () =>
    run(async () => {
      const response = await api.post(`${path}/confirm`, undefined, confirmDraftResponseSchema);
      const { status } = response.draft;

      setDraft((current) =>
        current ? { ...current, status, targetTicketNumber: response.ticket.number } : current,
      );
    });

  const cancel = () =>
    run(async () => {
      const response = await api.post(`${path}/cancel`, undefined, draftStatusResponseSchema);

      setDraft((current) => (current ? { ...current, status: response.draft.status } : current));
    });

  const saveTicket = (values: DraftEditValues) => run(() => patchTicket(draft, values, patch));

  const saveNote = (values: DraftNoteValues) => run(() => patchNote(draft, values, patch));

  return { actionError, isWorking, confirm, cancel, saveTicket, saveNote };
}

const patchTicket = async (
  draft: DraftProps | null,
  values: DraftEditValues,
  patch: (body: unknown) => Promise<void>,
): Promise<void> => {
  if (draft?.ticket == null) {
    return;
  }

  await patch({
    mode: "create",
    ticket: { ...draft.ticket, ...values, affected: values.affected || null },
  });
};

const patchNote = async (
  draft: DraftProps | null,
  values: DraftNoteValues,
  patch: (body: unknown) => Promise<void>,
): Promise<void> => {
  if (draft?.targetTicketNumber == null) {
    return;
  }

  await patch({ mode: "update", ticketNumber: draft.targetTicketNumber, note: values.note });
};
