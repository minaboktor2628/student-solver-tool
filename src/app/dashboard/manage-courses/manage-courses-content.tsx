"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  BookOpen,
  Trash2,
  Edit,
  ArrowLeft,
  Search,
  RefreshCw,
  Save,
  GraduationCap,
  Users as UsersIcon,
} from "lucide-react";

// shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateRequiredAssistantHours } from "@/lib/utils";
import type { Section, Term, TermLetter } from "@prisma/client";

// Course type from Prisma Section with flattened professor name
interface Course
  extends Pick<
    Section,
    | "id"
    | "courseCode"
    | "courseTitle"
    | "enrollment"
    | "capacity"
    | "requiredHours"
  > {
  professorName: string; // flattened from professor.name
  termId?: string | null; // optional for forms
}

// Term display type with computed name
interface TermDisplay extends Pick<Term, "id" | "termLetter" | "year"> {
  name: string; // computed from termLetter + year
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
  professorName: z
    .string()
    .min(1, "Professor name is required")
    .max(100, "Professor name is too long"),
  enrollment: z.coerce.number().min(0, "Enrollment must be 0 or greater"),
  capacity: z.coerce.number().min(0, "Capacity must be 0 or greater"),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export default function ManageCoursesContent() {
  const router = useRouter();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<TermDisplay[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
      professorName: "",
      enrollment: 0,
      capacity: 0,
    },
  });

  const editForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      courseCode: "",
      courseTitle: "",
      professorName: "",
      enrollment: 0,
      capacity: 0,
    },
  });

  // tRPC queries and mutations
  const getAllCoursesQuery = api.courses.getAllCourses.useQuery();
  const getTermsQuery = api.term.getAllTerms.useQuery();
  const createCourseMutation = api.courses.createCourses.useMutation();
  const updateCourseMutation = api.courses.updateCourse.useMutation();
  const deleteCourseMutation = api.courses.deleteCourse.useMutation();

  // Load data on mount
  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter courses when search query or selected term changes
  useEffect(() => {
    let filtered = courses;

    // Filter by term if selected
    if (selectedTerm) {
      filtered = filtered.filter((course) => course.termId === selectedTerm);
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.courseCode.toLowerCase().includes(query) ||
          course.courseTitle.toLowerCase().includes(query) ||
          course.professorName.toLowerCase().includes(query),
      );
    }

    setFilteredCourses(filtered);
  }, [searchQuery, courses, selectedTerm]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [coursesResult, termsResult] = await Promise.all([
        getAllCoursesQuery.refetch(),
        getTermsQuery.refetch(),
      ]);

      if (coursesResult.data?.success) {
        setCourses(coursesResult.data.courses);
        setFilteredCourses(coursesResult.data.courses);
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
          }) => ({
            id: term.id ?? "",
            name: term.name ?? "",
            termLetter: term.termLetter ?? ("A" as TermLetter),
            year: term.year ?? new Date().getFullYear(),
          }),
        );
        setTerms(formattedTerms);
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
      professorName: "",
      enrollment: 0,
      capacity: 0,
    });
    setIsAddDialogOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    editForm.reset({
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      professorName: course.professorName,
      enrollment: course.enrollment,
      capacity: course.capacity,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  const onSubmitAddCourse = async (values: CourseFormValues) => {
    try {
      const requiredHours = calculateRequiredAssistantHours(values.enrollment);

      await createCourseMutation.mutateAsync({
        courses: [
          {
            courseCode: values.courseCode,
            courseTitle: values.courseTitle,
            professorName: values.professorName,
            enrollment: values.enrollment,
            capacity: values.capacity,
            requiredHours,
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
          enrollment: values.enrollment,
          capacity: values.capacity,
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
                Add, edit, and remove courses from the system
              </p>
            </div>
          </div>
          <Button onClick={handleAddCourse} className="gap-2">
            <BookOpen className="h-4 w-4" />
            Add Course
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
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
              <CardTitle className="text-sm font-medium">With Term</CardTitle>
              <Badge variant="outline">Assigned</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courseStats.withTerm}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Without Term
              </CardTitle>
              <Badge variant="outline">Unassigned</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courseStats.withoutTerm}
              </div>
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

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by code, title, or professor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={selectedTerm ?? "all"}
            onValueChange={(value) =>
              setSelectedTerm(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
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
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Course Title</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Required Hours</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      <div className="text-muted-foreground py-8">
                        {searchQuery || selectedTerm
                          ? "No courses match your filters"
                          : "No courses found"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        {course.courseCode}
                      </TableCell>
                      <TableCell>{course.courseTitle}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="text-muted-foreground h-4 w-4" />
                          {course.professorName}
                        </div>
                      </TableCell>
                      <TableCell>{course.enrollment}</TableCell>
                      <TableCell>{course.capacity}</TableCell>
                      <TableCell>{course.requiredHours}h</TableCell>
                      <TableCell>
                        {course.termId ? (
                          <Badge variant="outline">
                            {terms.find((t) => t.id === course.termId)?.name ??
                              "Unknown"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCourse(course)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCourse(course)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Course Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Course</DialogTitle>
              <DialogDescription>
                Create a new course. Required hours will be calculated based on
                enrollment.
              </DialogDescription>
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
                <FormField
                  control={addForm.control}
                  name="professorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professor Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Roman Anthony" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        <FormDescription>
                          Required hours:{" "}
                          {calculateRequiredAssistantHours(
                            Number(field.value) || 0,
                          )}
                        </FormDescription>
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
              <DialogDescription>
                Update course information. Required hours will be recalculated.
              </DialogDescription>
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
                <FormField
                  control={editForm.control}
                  name="professorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professor Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Marcelo Mayer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        <FormDescription>
                          Required hours:{" "}
                          {calculateRequiredAssistantHours(
                            Number(field.value) || 0,
                          )}
                        </FormDescription>
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
