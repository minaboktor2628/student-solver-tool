"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AcademicLevel,
  Role,
  type Term,
  type TermLetter,
  type User,
} from "@prisma/client";
import { api } from "@/trpc/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import {
  BookOpen,
  ArrowLeft,
  RefreshCw,
  Save,
  Users as UsersIcon,
} from "lucide-react";

// shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/ui/data-table";
import { Combobox } from "@/components/ui/combobox";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createColumns, type Course } from "./columns";

interface TermDisplay extends Pick<Term, "id" | "termLetter" | "year"> {
  name: string;
  active: boolean;
}

// Zod schemas for validation
const courseFormSchema = z.object({
  courseCode: z
    .string()
    .min(1, "Course code is required")
    .max(20, "Course code is too long"),
  courseTitle: z
    .string()
    .min(1, "Course title is required")
    .max(200, "Course title is too long"),
  courseSection: z
    .string()
    .min(1, "Course section is required")
    .max(10, "Course section is too long"),
  meetingPattern: z
    .string()
    .min(1, "Meeting pattern is required")
    .max(100, "Meeting pattern is too long"),
  academicLevel: z.enum(["UNDERGRADUATE", "GRADUATE"]),
  description: z.string().max(1000, "Description is too long").optional(),
  professorId: z.string().min(1, "Professor is required"),
  enrollment: z.coerce.number().min(0, "Enrollment must be 0 or greater"),
  capacity: z.coerce.number().min(0, "Capacity must be 0 or greater"),
  requiredHours: z.coerce
    .number()
    .min(0, "Required hours must be 0 or greater"),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export default function ManageCoursesContent() {
  const router = useRouter();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<TermDisplay[]>([]);
  const [professors, setProfessors] = useState<Pick<User, "id" | "name">[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Forms
  const addForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      courseCode: "",
      courseTitle: "",
      courseSection: "",
      meetingPattern: "",
      academicLevel: "UNDERGRADUATE",
      description: "",
      professorId: "",
      enrollment: 0,
      capacity: 0,
      requiredHours: 0,
    },
  });

  const editForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      courseCode: "",
      courseTitle: "",
      courseSection: "",
      meetingPattern: "",
      academicLevel: "UNDERGRADUATE",
      description: "",
      professorId: "",
      enrollment: 0,
      capacity: 0,
      requiredHours: 0,
    },
  });

  // tRPC queries and mutations
  const getAllCoursesQuery = api.courses.getAllCourses.useQuery();
  const getTermsQuery = api.term.getAllTerms.useQuery();
  const getProfessorsQuery = api.staff.getAllUsers.useQuery();
  const createCourseMutation = api.courses.createCourses.useMutation();
  const updateCourseMutation = api.courses.updateCourse.useMutation();
  const deleteCourseMutation = api.courses.deleteCourse.useMutation();

  // Load data on mount
  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [coursesResult, termsResult, professorsResult] = await Promise.all([
        getAllCoursesQuery.refetch(),
        getTermsQuery.refetch(),
        getProfessorsQuery.refetch(),
      ]);

      if (coursesResult.data?.success) {
        const filtered = coursesResult.data.courses.filter(
          (course) => !selectedTerm || course.termId === selectedTerm,
        );
        setCourses(filtered);
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
        if (!selectedTerm) {
          const activeTermId = formattedTerms.find((t) => t.active)?.id;
          setSelectedTerm(activeTermId ?? formattedTerms[0]?.id ?? null);
        }
      }

      if (professorsResult.data) {
        const profs = (professorsResult.data.users ?? [])
          .filter((user) => user.roles.includes(Role.PROFESSOR))
          .map((user) => ({
            id: user.id,
            name: user.name ?? "Unknown",
          }));
        setProfessors(profs);
      }
    } catch (err: unknown) {
      console.error("Error fetching data:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCourse = () => {
    addForm.reset({
      courseCode: "",
      courseTitle: "",
      courseSection: "",
      meetingPattern: "",
      academicLevel: "UNDERGRADUATE",
      description: "",
      professorId: "",
      enrollment: 0,
      capacity: 0,
      requiredHours: 0,
    });
    setIsAddDialogOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    // Find the professor ID by matching the professor name
    const professorId =
      professors.find((p) => p.name === course.professorName)?.id ?? "";
    editForm.reset({
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      courseSection: course.courseSection,
      meetingPattern: course.meetingPattern,
      academicLevel: course.academicLevel,
      description: course.description,
      professorId,
      enrollment: course.enrollment,
      capacity: course.capacity,
      requiredHours: course.requiredHours,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  const onSubmitAddCourse = async (values: CourseFormValues) => {
    try {
      // Find the professor name from the ID
      const selectedProfessor = professors.find(
        (p) => p.id === values.professorId,
      );
      if (!selectedProfessor) {
        toast.error("Please select a valid professor");
        return;
      }

      await createCourseMutation.mutateAsync({
        courses: [
          {
            courseCode: values.courseCode,
            courseTitle: values.courseTitle,
            courseSection: values.courseSection,
            meetingPattern: values.meetingPattern,
            academicLevel: values.academicLevel,
            description: values.description,
            professorName: selectedProfessor.name,
            enrollment: values.enrollment,
            capacity: values.capacity,
            requiredHours: values.requiredHours,
          },
        ],
        termId: selectedTerm ?? undefined,
      });

      toast.success("Course added successfully!");
      setIsAddDialogOpen(false);
      addForm.reset();
      await fetchData();
    } catch (err: unknown) {
      console.error("Error adding course:", err);
      toast.error(err instanceof Error ? err.message : "Failed to add course");
    }
  };

  const onSubmitEditCourse = async (values: CourseFormValues) => {
    if (!selectedCourse) return;

    try {
      await updateCourseMutation.mutateAsync({
        id: selectedCourse.id,
        data: {
          courseCode: values.courseCode,
          courseTitle: values.courseTitle,
          courseSection: values.courseSection,
          meetingPattern: values.meetingPattern,
          academicLevel: values.academicLevel,
          description: values.description,
          professorId: values.professorId,
          enrollment: values.enrollment,
          capacity: values.capacity,
          requiredHours: values.requiredHours,
        },
      });

      toast.success("Course updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedCourse(null);
      editForm.reset();
      await fetchData();
    } catch (err: unknown) {
      console.error("Error updating course:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update course",
      );
    }
  };

  const confirmDeleteCourse = async () => {
    if (!selectedCourse) return;

    try {
      await deleteCourseMutation.mutateAsync({
        id: selectedCourse.id,
      });

      toast.success("Course deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
      await fetchData();
    } catch (err: unknown) {
      console.error("Error deleting course:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete course",
      );
      setIsDeleteDialogOpen(false);
    }
  };

  // Create table columns with handlers
  const columns = createColumns(handleEditCourse, handleDeleteCourse);

  // Course stats
  const courseStats = {
    total: courses.length,
    withTerm: courses.filter((c) => c.termId).length,
    withoutTerm: courses.filter((c) => !c.termId).length,
    totalEnrollment: courses.reduce((sum, c) => sum + c.enrollment, 0),
  };

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="text-primary h-8 w-8 animate-spin" />
          <span className="text-muted-foreground text-lg">
            Loading courses...
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
                Manage Courses
              </h1>
              <p className="text-muted-foreground text-sm">
                {selectedTerm
                  ? `Managing courses for ${terms.find((t) => t.id === selectedTerm)?.name ?? "Unknown Term"}`
                  : "Add, edit, and remove courses from the system"}
              </p>
            </div>
          </div>
          <Button onClick={handleAddCourse} className="gap-2">
            <BookOpen className="h-4 w-4" />
            Add Course
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Courses
              </CardTitle>
              <BookOpen className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courseStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Enrollment
              </CardTitle>
              <UsersIcon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courseStats.totalEnrollment}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <div className="mb-6 flex gap-4">
          <Select
            value={selectedTerm ?? ""}
            onValueChange={(value) => setSelectedTerm(value)}
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

        {/* Courses Table */}
        <Card>
          <CardContent className="p-6">
            <DataTable
              columns={columns}
              data={courses}
              searchKey="courseCode"
              searchPlaceholder="Search by code..."
            />
          </CardContent>
        </Card>

        {/* Add Course Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Course</DialogTitle>
              <DialogDescription>Create a new course.</DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form
                onSubmit={addForm.handleSubmit(onSubmitAddCourse)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="courseCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., CS 2102" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="courseTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Object-Oriented Design"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="courseSection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Section</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., LO1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="meetingPattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Pattern</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., M W F 10-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={addForm.control}
                  name="professorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professor</FormLabel>
                      <FormControl>
                        <Combobox
                          options={professors.map((p) => ({
                            value: p.id,
                            label: p.name ?? "Unknown Professor",
                          }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select a professor..."
                          searchPlaceholder="Search professors..."
                          emptyMessage="No professors found."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="academicLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Level</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={AcademicLevel.UNDERGRADUATE}>
                              Undergraduate
                            </SelectItem>
                            <SelectItem value={AcademicLevel.GRADUATE}>
                              Graduate
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="requiredHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Hours</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          Number of staff hours required for this course
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="enrollment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enrollment</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={addForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Course description" {...field} />
                      </FormControl>
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
                  <Button
                    type="submit"
                    disabled={createCourseMutation.isPending}
                  >
                    {createCourseMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Add Course
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Course Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>Update course information.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onSubmitEditCourse)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="courseCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., CS 2102" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="courseTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Object-Oriented Design"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="courseSection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Section</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., LO1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="meetingPattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Pattern</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., M W F 10-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="professorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professor</FormLabel>
                      <FormControl>
                        <Combobox
                          options={professors.map((p) => ({
                            value: p.id,
                            label: p.name ?? "Unknown Professor",
                          }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select a professor..."
                          searchPlaceholder="Search professors..."
                          emptyMessage="No professors found."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="academicLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Level</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={AcademicLevel.UNDERGRADUATE}>
                              Undergraduate
                            </SelectItem>
                            <SelectItem value={AcademicLevel.GRADUATE}>
                              Graduate
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="requiredHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Hours</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          Number of staff hours required for this course
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="enrollment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enrollment</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Course description" {...field} />
                      </FormControl>
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
                  <Button
                    type="submit"
                    disabled={updateCourseMutation.isPending}
                  >
                    {updateCourseMutation.isPending ? (
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
                <strong>
                  {selectedCourse?.courseCode} - {selectedCourse?.courseTitle}
                </strong>
                . This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteCourse}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleteCourseMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Course"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
