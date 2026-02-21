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

import { z } from "zod";
import { CSVDropzone } from "@/components/csv-dropzone";
import { Button } from "@/components/ui/button";
import { createUserInputSchema } from "@/types/form-inputs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldGroup } from "../ui/field";
import { FormCombobox, FormInput } from "../form";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState, type ReactNode } from "react";
import { PlusCircleIcon } from "lucide-react";

export function UploadAllowedUsersForm({
  termId,
  children,
}: {
  termId: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();
  const form = useForm({
    mode: "onChange",
    resolver: zodResolver(createUserInputSchema),
    defaultValues: { email: "", name: "", role: Role.PLA },
  });

  const uploadUsers = api.term.syncUsersToTerm.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (newusers) => {
      toast.success(`Success! Synced ${newusers} new user(s).`);
      form.reset();
      setOpen(false);
    },
    onSettled: async () => {
      await utils.term.invalidate();
      await utils.staff.invalidate();
      await utils.user.invalidate();
    },
  });

  function onSubmitArray(users: z.infer<typeof createUserInputSchema>[]) {
    uploadUsers.mutate({ users, termId });
  }

  function onSubmitOne(user: z.infer<typeof createUserInputSchema>) {
    onSubmitArray([user]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <PlusCircleIcon /> Add Users
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-5xl overflow-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Allowed Users</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="file">
          <TabsList>
            <TabsTrigger value="file">CSV upload</TabsTrigger>
            <TabsTrigger value="single">Single user</TabsTrigger>
          </TabsList>
          <TabsContent value="file">
            <CSVDropzone
              schema={createUserInputSchema}
              onSubmit={onSubmitArray}
              disabled={uploadUsers.isPending}
              dedupeBy={(row) => row.email}
              exampleRow={{
                name: "Boktor, Mina",
                email: "mboktor@wpi.edu",
                role: "PLA",
              }}
            />
          </TabsContent>
          <TabsContent value="single">
            <Card>
              <CardHeader>
                <CardTitle>Single user form</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={form.handleSubmit(onSubmitOne)}
                  className="space-y-2"
                >
                  <FieldGroup>
                    <FormInput
                      control={form.control}
                      name="name"
                      label="Name"
                      description='Must be in the format "last, first"'
                      placeholder="Boktor, Mina"
                    />
                    <FormInput
                      control={form.control}
                      name="email"
                      label="Email"
                      placeholder="mboktor@wpi.edu"
                    />
                    <FormCombobox
                      control={form.control}
                      name="role"
                      label="Role"
                      options={Object.values(Role).map((value) => ({
                        value,
                        label: value,
                      }))}
                    />
                    <Button
                      type="submit"
                      disabled={
                        uploadUsers.isPending || !form.formState.isValid
                      }
                    >
                      Submit
                    </Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
