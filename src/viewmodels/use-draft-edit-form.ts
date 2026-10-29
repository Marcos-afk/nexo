import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState } from "react-hook-form";
import type { CreateTicketInput } from "@/domain/ticket-input";
import type { DraftEditValues } from "@/models/draft";
import { draftEditSchema } from "@/schemas/draft";

interface UseDraftEditFormProps {
  readonly ticket: CreateTicketInput;
  readonly onSave: (values: DraftEditValues) => Promise<void>;
}

const valuesOf = (ticket: CreateTicketInput): DraftEditValues => ({
  title: ticket.title,
  description: ticket.description,
  category: ticket.category,
  priority: ticket.priority,
  affected: ticket.affected ?? "",
});

export function useDraftEditForm({ ticket, onSave }: UseDraftEditFormProps) {
  const form = useForm<DraftEditValues>({
    resolver: zodResolver(draftEditSchema),
    defaultValues: valuesOf(ticket),
  });
  const { errors, isSubmitting } = useFormState({ control: form.control });

  return {
    form,
    errors,
    isSubmitting,
    onSubmit: form.handleSubmit(onSave),
  };
}
