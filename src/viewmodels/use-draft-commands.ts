import { api } from "@/lib/api";
import type { DraftEditValues } from "@/models/draft";
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

  const save = (values: DraftEditValues) =>
    run(async () => {
      if (draft?.ticket == null) {
        return;
      }

      const ticket = { ...draft.ticket, ...values, affected: values.affected || null };
      const response = await api.patch(path, { mode: "create", ticket }, draftResponseSchema);

      setDraft(response.draft);
    });

  return { actionError, isWorking, confirm, cancel, save };
}
