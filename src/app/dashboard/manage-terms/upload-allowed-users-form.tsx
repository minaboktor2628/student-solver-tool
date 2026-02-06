"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { Role } from "@prisma/client";
import { toast } from "sonner";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { parseCSV } from "@/lib/csv";
import z from "zod";

const CSVRowSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(Role),
});

type CSVRow = z.infer<typeof CSVRowSchema>;

export function UploadAllowedUsersForm({ termId }: { termId: string }) {
  const [files, setFiles] = useState<File[] | undefined>(undefined);
  const [rows, setRows] = useState<CSVRow[] | null>(null);

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

  async function handleDrop(acceptedFiles: File[]) {
    setRows(null);
    setFiles(acceptedFiles);

    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseCSV(text, z.array(CSVRowSchema));
      setRows(parsed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to read file");
    }
  }

  function handleSubmit() {
    if (!rows) return;
    uploadUsers.mutate({ users: rows, termId });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Upload Users
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Allowed Users</DialogTitle>
          <DialogDescription>
            Upload a CSV with these three columns: name, email, role. The first
            line of the file must define the column names. Role can be either
            TA, PLA, or PROFESSOR. Names must be in the format &quot;Last,
            First&quot;. Since the name field has a comma separator, they must
            be wrapped with quotes. If you wish, you can create users in the
            Manage Users page. Here is an example file:
            <div className="flex flex-col items-center justify-center p-2">
              <Image
                width={500}
                height={500}
                src="/example-allowed-user-csv.png"
                alt="Example CSV"
              />
            </div>
          </DialogDescription>
        </DialogHeader>
        <Dropzone
          src={files}
          accept={{ "text/csv": [".csv"] }}
          maxFiles={1}
          onDrop={handleDrop}
          maxSize={5 * 1024 * 1024}
        >
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>

        <div className="no-scrollbar -mx-4 max-h-[25vh] overflow-y-auto px-4">
          {rows && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.email}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <Button
          disabled={!rows || uploadUsers.isPending}
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </DialogContent>
    </Dialog>
  );
}
