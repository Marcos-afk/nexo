import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { DRAFT_LOAD_ERROR } from "@/constants/ticket";
import { api } from "@/lib/api";
import type { DraftProps } from "@/models/draft";
import { draftResponseSchema } from "@/schemas/draft";
import { errorMessageOf } from "@/utils/error-message";

export const draftPathOf = (id: string): string => `/api/drafts/${id}`;

export interface DraftResource {
  readonly draft: DraftProps | null;
  readonly setDraft: Dispatch<SetStateAction<DraftProps | null>>;
  readonly loadError: string | null;
}

export function useDraftResource(draftId: string): DraftResource {
  const [draft, setDraft] = useState<DraftProps | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    api
      .get(draftPathOf(draftId), draftResponseSchema, controller.signal)
      .then((response) => setDraft(response.draft))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(errorMessageOf(error, DRAFT_LOAD_ERROR));
        }
      });

    return () => controller.abort();
  }, [draftId]);

  return { draft, setDraft, loadError };
}
