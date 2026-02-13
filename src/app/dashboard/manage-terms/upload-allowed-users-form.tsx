"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { Role } from "@prisma/client";
import { toast } from "sonner";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import z from "zod";
import { CSVDropzone } from "@/components/csv-dropzone";

const CSVRowSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(Role),
});

type CSVRow = z.infer<typeof CSVRowSchema>;

export function UploadAllowedUsersForm({ termId }: { termId: string }) {
  const utils = api.useUtils();
  const uploadUsers = api.term.syncUsersToTerm.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (newusers) => {
      const message = `Success! Synced ${newusers} new users.`;
      toast.success(message);
      console.log(message);
    },
    onSettled: async () => {
      await utils.term.getTermStats.invalidate();
    },
  });

  function handleSubmit(users: CSVRow[]) {
    uploadUsers.mutate({ users, termId });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Upload Users
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-5xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Allowed Users</DialogTitle>
        </DialogHeader>
        <CSVDropzone
          schema={CSVRowSchema}
          onSubmit={handleSubmit}
          disabled={uploadUsers.isPending}
          dedupeBy={(row) => row.email}
          exampleRow={{
            name: "Boktor, Mina",
            email: "mboktor@wpi.edu",
            role: "PLA",
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
