import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState } from "react-hook-form";
import type { DraftNoteValues } from "@/models/draft";
import { draftNoteEditSchema } from "@/schemas/draft";

interface UseDraftNoteFormProps {
  readonly note: string;
  readonly onSave: (values: DraftNoteValues) => Promise<void>;
}

export function useDraftNoteForm({ note, onSave }: UseDraftNoteFormProps) {
  const form = useForm<DraftNoteValues>({
    resolver: zodResolver(draftNoteEditSchema),
    defaultValues: { note },
  });
  const { errors, isSubmitting } = useFormState({ control: form.control });

  return { form, errors, isSubmitting, onSubmit: form.handleSubmit(onSave) };
}
