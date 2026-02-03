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
import { Role, TermLetter } from "@prisma/client";
import z from "zod";
import { FormDatePicker, FormInput, FormSelect } from "@/components/form";
import { SelectItem } from "@/components/ui/select";
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

type CSVRow = {
  email: string;
  name: string;
  role: Role;
};

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'; // escaped quote
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = (lines[0] ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase());
  const emailIndex = headers.indexOf("email");
  const nameIndex = headers.indexOf("name");
  const roleIndex = headers.indexOf("role");

  if (emailIndex === -1 || nameIndex === -1 || roleIndex === -1) {
    throw new Error("CSV must contain email, name, and role columns");
  }

  const validRoles = ["PLA", "TA", "PROFESSOR"] as const;
  const rolesEnum = z.enum(validRoles);

  return lines
    .slice(1)
    .map((line, lineIndex) => {
      const values = splitCSVLine(line);
      const email = values[emailIndex] ?? "";
      const name = values[nameIndex] ?? "";
      const role = rolesEnum.parse((values[roleIndex] ?? "").toUpperCase());

      return { email, name, role, lineIndex: lineIndex + 2 };
    })
    .filter((row) => {
      // Skip empty rows
      if (!row.email && !row.name && !row.role) {
        return false;
      }

      return true;
    })
    .map(({ lineIndex: _lineIndex, ...row }) => row);
}

export function UploadAllowedUsersForm({ termId }: { termId: string }) {
  const [files, setFiles] = useState<File[] | undefined>(undefined);
  const [rows, setRows] = useState<CSVRow[] | null>(null);

  const uploadUsers = api.users.createUsers.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Success!");
    },
  });

  async function handleDrop(acceptedFiles: File[]) {
    setRows(null);
    setFiles(acceptedFiles);

    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseCSV(text);
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Upload Allowed Users</DialogTitle>
          <DialogDescription>
            Upload a CSV with these three columns: name, email, role. The first
            line of the file must define the column names. Role can be either
            TA, PLA, or PROFESSOR. Names must be in the format Last, First. If
            you wish, you can create users in the Manage Users page.
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
