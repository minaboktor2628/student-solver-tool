"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/trpc/react";
import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { createTermInputSchema } from "@/types/form-inputs";
import { TermLetter } from "@prisma/client";
import type z from "zod";
import { FormDatePicker, FormInput, FormSelect } from "@/components/form";
import { SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

export function CreateTermDialogForm() {
  const utils = api.useUtils();
  const form = useForm({
    resolver: zodResolver(createTermInputSchema),
    defaultValues: {
      termLetter: "A" as TermLetter,
      year: new Date().getFullYear(),
      termProfessorDueDate: new Date(),
      termStaffDueDate: new Date(),
    },
  });

  const createTerm = api.term.createTerm.useMutation({
    onError: (error, variables) => {
      toast.error(error.message, {
        action: <Button onClick={() => onSubmit(variables)}>Retry</Button>,
      });
    },
    onSuccess: async () => {
      toast.success("Successfully created a term!");
      await utils.term.getTermStats.invalidate();
      form.reset();
    },
  });

  function onSubmit(data: z.infer<typeof createTermInputSchema>) {
    createTerm.mutate(data);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon /> Create new term
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create term</DialogTitle>
          <DialogDescription>
            After creating the term, you still need to upload a CSV of users for
            this term and set it to active when you are ready.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <FormInput control={form.control} name="year" label="Term year" />
            <FormSelect
              control={form.control}
              name="termLetter"
              label="Term Letter"
              description="A and C terms also account for Fall and Spring respectively"
            >
              {Object.values(TermLetter).map((letter) => (
                <SelectItem key={letter} value={letter}>
                  {letter}
                </SelectItem>
              ))}
            </FormSelect>
            <FormDatePicker
              control={form.control}
              name="termStaffDueDate"
              label="Staff preferrence due date"
            />
            <FormDatePicker
              control={form.control}
              name="termProfessorDueDate"
              label="Professor preferrence due date"
            />
          </FieldGroup>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={createTerm.isPending}>
              Create term
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
