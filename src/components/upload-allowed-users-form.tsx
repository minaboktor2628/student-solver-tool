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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, type ReactNode } from "react";
import {
  SingleAddUserForm,
  type SingleUserFormValues,
} from "@/components/single-add-user-form";

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
      // Ensure staff/user lists refresh so newly-created users appear immediately
      try {
        await utils.staff.getAllUsers.invalidate();
      } catch (err) {
        // ignore if route not present in cache
      }
    },
  });

  function handleSubmit(users: CSVRow[]) {
    uploadUsers.mutate({ users, termId });
  }

  // Single-user form now uses SingleAddUserForm (react-hook-form)

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
          <Tabs defaultValue="csv">
            <TabsList>
              <TabsTrigger value="csv">Upload CSV</TabsTrigger>
              <TabsTrigger value="form">Add Individual</TabsTrigger>
            </TabsList>

            <TabsContent value="csv">
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
            </TabsContent>

            <TabsContent value="form">
              <div className="flex justify-start">
                <div className="w-80">
                  <div className="bg-background/50 space-y-2 rounded-md border p-4">
                    <div className="text-lg font-medium">
                      Add Individual User
                    </div>
                    <SingleAddUserForm
                      onSubmit={async (values: SingleUserFormValues) => {
                        uploadUsers.mutate({ users: [values], termId });
                      }}
                      submitLabel="Add User"
                      disabled={uploadUsers.isPending}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
