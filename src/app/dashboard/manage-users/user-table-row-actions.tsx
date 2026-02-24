"use client";
import { api } from "@/trpc/react";
import type { UserTableRow } from "./manage-users-content";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserInputSchema } from "@/types/form-inputs";
import {
  Edit,
  LockIcon,
  MoreHorizontal,
  RefreshCw,
  Save,
  Settings2Icon,
  Trash2,
  Unlock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isAssistant, isProfessor } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type z from "zod";
import { FormCombobox, FormInput } from "@/components/form";
import { Role } from "@prisma/client";
import Link from "next/link";

export function UserTableRowAction({
  termId,
  user,
}: {
  termId: string;
  user: UserTableRow;
}) {
  const utils = api.useUtils();
  const deleteUserMutation = api.staff.deleteUser.useMutation({
    onSuccess: async () => {
      toast.success("User deleted successfully!");
      await utils.staff.getAllUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const toggleUserLockMutation = api.staff.toggleUserLock.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      await utils.staff.getAllUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateUserMutation = api.staff.updateUser.useMutation({
    onSuccess: async () => {
      toast.success("User updated successfully!");
      await utils.staff.getAllUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const editForm = useForm({
    resolver: zodResolver(createUserInputSchema),
    defaultValues: {
      name: user.name ?? "",
      email: user.email ?? "",
      role: user.roles[0] ?? ("PLA" as const),
    },
  });

  function handleDelete() {
    deleteUserMutation.mutate({ userId: user.id });
  }

  function onToggleUserLock(userId: string) {
    toggleUserLockMutation.mutate({ userId, termId });
  }

  function onEdit(values: z.infer<typeof createUserInputSchema>) {
    updateUserMutation.mutate({
      userId: user.id,
      ...values,
    });
  }

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {isProfessor(user) && (
            <DropdownMenuItem asChild>
              <Link
                href={{
                  pathname: "/professor",
                  query: { userId: user.id, termId },
                }}
                target="_blank"
              >
                <Settings2Icon className="size-4" /> Edit staff preferences
              </Link>
            </DropdownMenuItem>
          )}
          {isAssistant(user) && (
            <DropdownMenuItem asChild>
              <Link
                href={{
                  pathname: "/preferences-form",
                  query: { userId: user.id, termId },
                }}
                target="_blank"
              >
                <Settings2Icon className="size-4" /> Edit staff preferences
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onToggleUserLock(user.id)}>
            {user.locked ? (
              <>
                <Unlock className="h-4 w-4" /> Unlock preferences
              </>
            ) : (
              <>
                <LockIcon className="h-4 w-4" /> Lock preferences
              </>
            )}
          </DropdownMenuItem>
          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="h-4 w-4" /> Edit user
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user information. All fields are required.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={editForm.handleSubmit(onEdit)}
                className="space-y-4"
              >
                <FormInput
                  control={editForm.control}
                  name="name"
                  label="Name"
                />
                <FormInput
                  control={editForm.control}
                  name="email"
                  label="Email"
                />
                <FormCombobox
                  control={editForm.control}
                  name="role"
                  label="Role"
                  options={Object.values(Role).map((value) => ({
                    value,
                    label: value,
                  }))}
                />
                <DialogFooter>
                  <Button type="submit" disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleDelete}>
            {/*TODO: add alert dialog*/}
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
