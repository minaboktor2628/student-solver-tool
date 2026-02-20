"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import { RefreshCw, Save, Lock, Unlock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { createColumns } from "./columns";
import { UploadAllowedUsersForm } from "@/app/dashboard/manage-terms/upload-allowed-users-form";
import { humanizeKey } from "@/lib/utils";
import { TermCombobox, useTerm } from "@/components/term-combobox";

// Zod schemas for validation
const ALLOWED_ROLES = [Role.PLA, Role.TA, Role.GLA, Role.PROFESSOR] as const;

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  role: z.enum(ALLOWED_ROLES, {
    required_error: "Please select a role",
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const ROLE_OPTIONS: Array<{
  value: (typeof ALLOWED_ROLES)[number];
  label: string;
}> = [
  { value: Role.PLA, label: "PLA" },
  { value: Role.TA, label: "TA" },
  { value: Role.GLA, label: "GLA" },
  { value: Role.PROFESSOR, label: "Professor" },
];

export type UserTableRow =
  RouterOutputs["staff"]["getAllUsers"]["users"][number];

export default function ManageUsersContent() {
  const { selectedTerm } = useTerm();

  if (!selectedTerm) throw new Error("No selected term!");

  // Query users based on selected term
  const [{ users }] = api.staff.getAllUsers.useSuspenseQuery({
    termId: selectedTerm.id,
  });

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserTableRow | null>(null);

  // Forms
  const addForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: Role.PLA,
    },
  });

  const editForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: Role.PLA,
    },
  });

  // tRPC utils and mutations
  const utils = api.useUtils();

  const createUserMutation = api.staff.createUser.useMutation({
    onSuccess: async () => {
      toast.success("User added successfully!");
      setIsAddDialogOpen(false);
      addForm.reset();
      await utils.staff.getAllUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateUserMutation = api.staff.updateUser.useMutation({
    onSuccess: async () => {
      toast.success("User updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      editForm.reset();
      await utils.staff.getAllUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const lockAllMutation = api.staff.lockAllStaffPreferences.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      await utils.staff.getAllUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const unlockAllMutation = api.staff.unlockAllStaffPreferences.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
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

  const handleAddUser = () => {
    addForm.reset();
    setIsAddDialogOpen(true);
  };

  const handleEditUser = (user: UserTableRow) => {
    setSelectedUser(user);
    // Find the first allowed role, or default to PLA
    const userRole =
      user.roles?.find((r) =>
        ALLOWED_ROLES.includes(r as (typeof ALLOWED_ROLES)[number]),
      ) ?? Role.PLA;
    editForm.reset({
      name: user.name ?? "",
      email: user.email ?? "",
      role: userRole as (typeof ALLOWED_ROLES)[number],
    });
    setIsEditDialogOpen(true);
  };

  const onSubmitAddUser = (values: UserFormValues) => {
    createUserMutation.mutate({
      name: values.name,
      email: values.email,
      role: values.role,
    });
  };

  const onSubmitEditUser = (values: UserFormValues) => {
    if (!selectedUser) return;

    updateUserMutation.mutate({
      userId: selectedUser.id,
      name: values.name,
      email: values.email,
      role: values.role,
    });
  };

  const handleLockAll = () => {
    lockAllMutation.mutate({ termId: selectedTerm.id });
  };

  const handleUnlockAll = () => {
    unlockAllMutation.mutate({ termId: selectedTerm.id });
  };

  const handleToggleUserLock = (user: UserTableRow) => {
    toggleUserLockMutation.mutate({ userId: user.id, termId: selectedTerm.id });
  };

  // Create table columns with handlers
  const columns = createColumns(
    handleEditUser,
    handleToggleUserLock,
    selectedTerm.id,
  );

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-foreground text-3xl font-bold">Manage Users</h1>
            <p className="text-muted-foreground text-sm">
              Managing users for {selectedTerm.label} term
            </p>
          </div>
        </div>
        <TermCombobox />
      </div>

      {/* Users Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage staff and professors in the system. You can lock/unlock
                the preference forms for individuals here.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            selectable
            toolbarProps={{
              searchPlaceholder: "Search by name...",
              searchColumnIds: ["name"],
              facetedFilters: [
                {
                  columnId: "roles",
                  title: "Roles",
                  options: Object.values(Role).map((value) => ({
                    value,
                    label: humanizeKey(value),
                  })),
                },
              ],
            }}
            renderFooterExtras={(table) => {
              // TODO: use the tables selected rows to only lock/unlock the selected people
              return (
                <div className="ml-auto flex gap-2">
                  <Button
                    onClick={handleLockAll}
                    variant="destructive"
                    className="gap-2"
                    disabled={lockAllMutation.isPending}
                  >
                    {lockAllMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    Lock All
                  </Button>
                  <Button
                    onClick={handleUnlockAll}
                    variant="outline"
                    className="gap-2"
                    disabled={unlockAllMutation.isPending}
                  >
                    {unlockAllMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                    Unlock All
                  </Button>
                </div>
              );
            }}
            renderToolbarActions={(table) => {
              return (
                <UploadAllowedUsersForm
                  termId={selectedTerm.id}
                  triggerVariant="default"
                />
              );
            }}
          />
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form
              onSubmit={addForm.handleSubmit(onSubmitAddUser)}
              className="space-y-4"
            >
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Roman Anthony" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="e.g., ranthony@wpi.edu"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Add User
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onSubmitEditUser)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Marcelo Mayer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="e.g., mmayer@wpi.edu"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
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
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
