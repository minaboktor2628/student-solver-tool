"use client";
// TODO: Clean up this component.

import { useState, useMemo } from "react";
import Link from "next/link";
import { Role, type Term, type TermLetter } from "@prisma/client";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
  UserPlus,
  ArrowLeft,
  RefreshCw,
  Users,
  Save,
  Lock,
  Unlock,
  LockKeyhole,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// shadcn components
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
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { createColumns, type User } from "./columns";
import { UploadAllowedUsersForm } from "@/app/dashboard/manage-terms/upload-allowed-users-form";
import { humanizeKey } from "@/lib/utils";

interface TermDisplay extends Pick<Term, "id" | "termLetter" | "year"> {
  name: string;
  active: boolean;
}

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

export default function ManageUsersContent() {
  // tRPC queries (suspense)
  const [{ terms: rawTerms }] = api.term.getAllTerms.useSuspenseQuery();

  // Derived data
  const terms: TermDisplay[] = useMemo(
    () =>
      (rawTerms ?? []).map((term) => ({
        id: term.id ?? "",
        name: term.name ?? "",
        termLetter: term.termLetter ?? ("A" as TermLetter),
        year: term.year ?? new Date().getFullYear(),
        active: term.active ?? false,
      })),
    [rawTerms],
  );

  // State
  const [activeTermId, setActiveTermId] = useState<string>(() => {
    const activeTerm = terms.find((t) => t.active);
    return activeTerm?.id ?? terms[0]?.id ?? "";
  });

  // Query users based on selected term
  const [{ users }] = api.staff.getAllUsers.useSuspenseQuery({
    termId: activeTermId,
  });

  // Derived state
  const activeTerm = useMemo(
    () => terms.find((t) => t.id === activeTermId)?.name ?? null,
    [terms, activeTermId],
  );

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

  const deleteUserMutation = api.staff.deleteUser.useMutation({
    onSuccess: async () => {
      toast.success("User deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      await utils.staff.getAllUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsDeleteDialogOpen(false);
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

  const handleEditUser = (user: User) => {
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

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
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

  const confirmDeleteUser = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate({ userId: selectedUser.id });
  };

  const handleLockAll = () => {
    if (!activeTermId) {
      toast.error("No active term found");
      return;
    }
    lockAllMutation.mutate({ termId: activeTermId });
  };

  const handleUnlockAll = () => {
    if (!activeTermId) {
      toast.error("No active term found");
      return;
    }
    unlockAllMutation.mutate({ termId: activeTermId });
  };

  const handleToggleUserLock = (user: User) => {
    if (!activeTermId) {
      toast.error("No active term found");
      return;
    }
    toggleUserLockMutation.mutate({ userId: user.id, termId: activeTermId });
  };

  // Create table columns with handlers
  const columns = createColumns(
    handleEditUser,
    handleDeleteUser,
    handleToggleUserLock,
    activeTermId,
  );

  // Count users by role for stats
  const countByRole = (role: Role) =>
    users.filter((u) => u.roles.includes(role)).length;
  const userStats = {
    pla: countByRole(Role.PLA),
    ta: countByRole(Role.TA),
    gla: countByRole(Role.GLA),
    professor: countByRole(Role.PROFESSOR),
  };
  const totalUsers =
    userStats.pla + userStats.ta + userStats.gla + userStats.professor;

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-foreground text-3xl font-bold">
                Manage Users
              </h1>
              <p className="text-muted-foreground text-sm">
                {activeTerm
                  ? `Managing users for ${activeTerm}`
                  : "Add, edit, and remove users from the system"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PLAs</CardTitle>
              <Badge className="bg-primary/20 text-primary border-primary/30">
                PLA
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.pla}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TAs</CardTitle>
              <Badge className="bg-chart-5/20 text-chart-5 border-chart-5/30">
                TA
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.ta}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GLAs</CardTitle>
              <Badge className="bg-chart-2/20 text-chart-2 border-chart-2/30">
                GLA
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.gla}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professors</CardTitle>
              <Badge className="bg-chart-3/20 text-chart-3 border-chart-3/30">
                PROF
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.professor}</div>
            </CardContent>
          </Card>
        </div>

        {/* Term Filter */}
        <div className="mb-6 flex gap-4">
          <Select
            value={activeTermId ?? ""}
            onValueChange={(value) => setActiveTermId(value)}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Users Data Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Manage staff and professors in the system
                </CardDescription>
              </div>
            </div>
            {activeTerm && (
              <div className="bg-muted/50 border-border mt-4 rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="text-primary h-4 w-4" />
                  <p className="text-muted-foreground text-sm">
                    Lock/unlock preferences for {activeTerm}. Locked users
                    cannot edit their preferences. Individual locks override the
                    global setting.
                  </p>
                </div>
              </div>
            )}
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
                    termId={activeTermId}
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete{" "}
                <strong>{selectedUser?.name}</strong> ({selectedUser?.email}).
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteUser}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete User"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
