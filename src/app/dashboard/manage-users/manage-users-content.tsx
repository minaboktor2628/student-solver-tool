"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { DataTable } from "@/components/ui/data-table";
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
  const router = useRouter();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [terms, setTerms] = useState<TermDisplay[]>([]);
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const [activeTermId, setActiveTermId] = useState<string | null>(null);

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

  // tRPC queries and mutations
  const getUsersQuery = api.staff.getAllUsers.useQuery(
    { termId: activeTermId ?? undefined },
    { enabled: !!activeTermId },
  );
  const getTermsQuery = api.term.getAllTerms.useQuery();
  const createUserMutation = api.staff.createUser.useMutation();
  const updateUserMutation = api.staff.updateUser.useMutation();
  const deleteUserMutation = api.staff.deleteUser.useMutation();
  const lockAllMutation = api.staff.lockAllStaffPreferences.useMutation();
  const unlockAllMutation = api.staff.unlockAllStaffPreferences.useMutation();
  const toggleUserLockMutation = api.staff.toggleUserLock.useMutation();

  // Load users on mount
  useEffect(() => {
    void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [usersResult, termsResult] = await Promise.all([
        getUsersQuery.refetch(),
        getTermsQuery.refetch(),
      ]);

      if (usersResult.data) {
        setUsers(usersResult.data.users);
      }

      if (termsResult.data) {
        const formattedTerms: TermDisplay[] = (
          termsResult.data.terms ?? []
        ).map(
          (term: {
            id?: string;
            name?: string;
            termLetter?: TermLetter;
            year?: number;
            active?: boolean;
          }) => ({
            id: term.id ?? "",
            name: term.name ?? "",
            termLetter: term.termLetter ?? ("A" as TermLetter),
            year: term.year ?? new Date().getFullYear(),
            active: term.active ?? false,
          }),
        );
        setTerms(formattedTerms);

        if (!activeTermId) {
          const activeTermData = formattedTerms.find((t) => t.active);
          if (activeTermData) {
            setActiveTerm(activeTermData.name ?? null);
            setActiveTermId(activeTermData.id ?? null);
          }
        }
      }
    } catch (err: unknown) {
      console.error("Error fetching users:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTermId) {
      void getUsersQuery.refetch();
    }
    const termName = terms.find((t) => t.id === activeTermId)?.name ?? null;
    setActiveTerm(termName);
  }, [activeTermId, terms, getUsersQuery]);

  const handleAddUser = () => {
    addForm.reset({
      name: "",
      email: "",
      role: Role.PLA,
    });
    setIsAddDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    // Find the first allowed role, or default to PLA
    const userRole =
      user.roles.find((r) =>
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

  const onSubmitAddUser = async (values: UserFormValues) => {
    try {
      await createUserMutation.mutateAsync({
        name: values.name,
        email: values.email,
        role: values.role,
      });

      toast.success("User added successfully!");
      setIsAddDialogOpen(false);
      addForm.reset();
      await fetchUsers();
    } catch (err: unknown) {
      console.error("Error adding user:", err);
      toast.error(err instanceof Error ? err.message : "Failed to add user");
    }
  };

  const onSubmitEditUser = async (values: UserFormValues) => {
    if (!selectedUser) return;

    try {
      await updateUserMutation.mutateAsync({
        userId: selectedUser.id,
        name: values.name,
        email: values.email,
        role: values.role,
      });

      toast.success("User updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      editForm.reset();
      await fetchUsers();
    } catch (err: unknown) {
      console.error("Error updating user:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteUserMutation.mutateAsync({
        userId: selectedUser.id,
      });

      toast.success("User deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err: unknown) {
      console.error("Error deleting user:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
      setIsDeleteDialogOpen(false);
    }
  };

  const handleLockAll = async () => {
    if (!activeTermId) {
      toast.error("No active term found");
      return;
    }

    try {
      const result = await lockAllMutation.mutateAsync({
        termId: activeTermId,
      });
      toast.success(result.message);
      await fetchUsers();
    } catch (err: unknown) {
      console.error("Error locking all:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to lock all users",
      );
    }
  };

  const handleUnlockAll = async () => {
    if (!activeTermId) {
      toast.error("No active term found");
      return;
    }

    try {
      const result = await unlockAllMutation.mutateAsync({
        termId: activeTermId,
      });
      toast.success(result.message);
      await fetchUsers();
    } catch (err: unknown) {
      console.error("Error unlocking all:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to unlock all users",
      );
    }
  };

  const handleToggleUserLock = async (user: User) => {
    if (!activeTermId) {
      toast.error("No active term found");
      return;
    }

    try {
      const result = await toggleUserLockMutation.mutateAsync({
        userId: user.id,
        termId: activeTermId,
      });
      toast.success(result.message);
      await fetchUsers();
    } catch (err: unknown) {
      console.error("Error toggling user lock:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to toggle user lock",
      );
    }
  };

  // Create table columns with handlers
  const columns = createColumns(
    handleEditUser,
    handleDeleteUser,
    (user: User) => void handleToggleUserLock(user),
    activeTerm,
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

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="text-primary h-8 w-8 animate-spin" />
          <span className="text-muted-foreground text-lg">
            Loading users...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
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
          <Button onClick={handleAddUser} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
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
              {activeTerm && (
                <div className="flex gap-2">
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
              )}
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
          <CardContent className="p-6">
            <DataTable
              columns={columns}
              data={users}
              searchKey="name"
              searchPlaceholder="Search by name..."
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
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
