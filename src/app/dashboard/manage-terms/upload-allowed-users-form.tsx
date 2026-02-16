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

import z from "zod";
import { CSVDropzone } from "@/components/csv-dropzone";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, type ReactNode } from "react";

const CSVRowSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(Role),
});

type CSVRow = z.infer<typeof CSVRowSchema>;

export function UploadAllowedUsersForm({
  termId,
  triggerVariant,
  trigger,
}: {
  termId: string;
  triggerVariant?: "destructive" | "outline" | "default";
  trigger?: ReactNode;
}) {
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

  // Single-user form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"" | Role>("");

  function handleSingleSubmit(e?: any) {
    e?.preventDefault?.();
    try {
      const user = CSVRowSchema.parse({ name, email, role });
      uploadUsers.mutate({ users: [user], termId });
      setName("");
      setEmail("");
      setRole("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid input");
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={triggerVariant ?? "outline"}>
            Upload / Add Users
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-5xl overflow-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Allowed Users</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
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
          </div>

          <div className="flex justify-start">
            <div className="w-80">
              <div className="bg-background/50 space-y-2 rounded-md border p-4">
                <div className="text-lg font-medium">Add Individual User</div>
                <form onSubmit={handleSingleSubmit} className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Last, First"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mboktor@wpi.edu"
                      type="email"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                      className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                    >
                      <option value="">Select role</option>
                      {Object.values(Role).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={uploadUsers.isPending}
                      variant="default"
                    >
                      Add User
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
