"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AcademicLevel,
  Role,
  type Term,
  type TermLetter,
} from "@prisma/client";
import { api } from "@/trpc/react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { CourseForm } from "./CourseForm";
import { BookOpen, RefreshCw, Save, Users as UsersIcon } from "lucide-react";

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
import {
  AddCourseCard,
  courseFormSchema,
  type CourseFormValues,
} from "./add-course-card";

interface TermDisplay extends Pick<Term, "id" | "termLetter" | "year"> {
  name: string;
  active: boolean;
}

export default function ManageCoursesContent() {
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

  // Declare selectedTerm after terms (match manage-users pattern)
  const [selectedTerm, setSelectedTerm] = useState<string>(() => {
    const activeTerm = terms.find((t) => t.active);
    return activeTerm?.id ?? terms[0]?.id ?? "";
  });

  const [{ users: rawUsers }] = api.staff.getAllUsers.useSuspenseQuery({
    termId: selectedTerm,
  });

  const [{ courses: allCourses }] = api.courses.getAllCourses.useSuspenseQuery({
    termId: selectedTerm,
  });

  // ...existing code...
  // Filtered courses (move after allCourses and selectedTerm)
  let courses: Course[] = [];
  if (Array.isArray(allCourses)) {
    courses = allCourses.filter((course) => course.termId === selectedTerm);
  }

  const professors = useMemo(
    () =>
      (rawUsers ?? [])
        .filter((user) => user.roles.includes(Role.PROFESSOR))
        .map((user) => ({
          id: user.id,
          name: user.name ?? "Unknown",
        })),
    [rawUsers],
  );

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

  // tRPC utils and mutations
  const utils = api.useUtils();

  const createCourseMutation = api.courses.createCourses.useMutation({
    onSuccess: async () => {
      toast.success("Course added successfully!");
      setIsAddDialogOpen(false);
      addForm.reset();
      await utils.courses.getAllCourses.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateCourseMutation = api.courses.updateCourse.useMutation({
    onSuccess: async () => {
      toast.success("Course updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedCourse(null);
      editForm.reset();
      await utils.courses.getAllCourses.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteCourseMutation = api.courses.deleteCourse.useMutation({
    onSuccess: async () => {
      toast.success("Course deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
      await utils.courses.getAllCourses.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsDeleteDialogOpen(false);
    },
  });

  const handleAddCourse = () => {
    addForm.reset();
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

  const onSubmitAddCourse = (values: CourseFormValues) => {
    // Find the professor name from the ID
    const selectedProfessor = professors.find(
      (p) => p.id === values.professorId,
    );
    if (!selectedProfessor) {
      toast.error("Please select a valid professor");
      return;
    }

    createCourseMutation.mutate({
      courses: [
        {
          courseCode: values.courseCode,
          courseTitle: values.courseTitle,
          courseSection: values.courseSection,
          meetingPattern: values.meetingPattern,
          academicLevel: values.academicLevel,
          description: values.description,
          professorName: selectedProfessor.name ?? "",
          enrollment: values.enrollment,
          capacity: values.capacity,
          requiredHours: values.requiredHours,
        },
      ],
      termId: selectedTerm ?? undefined,
    });
  };

  const onSubmitEditCourse = (values: CourseFormValues) => {
    if (!selectedCourse) return;

    updateCourseMutation.mutate({
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
  };

  const confirmDeleteCourse = () => {
    if (!selectedCourse) return;
    deleteCourseMutation.mutate({ id: selectedCourse.id });
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

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
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

        <AddCourseCard
          isOpen={isAddDialogOpen}
          form={addForm}
          professors={professors}
          onCancel={() => setIsAddDialogOpen(false)}
          onSubmit={onSubmitAddCourse}
          isSubmitting={createCourseMutation.isPending}
        />

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
            value={selectedTerm}
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

        {/* Edit Course Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>Update course information.</DialogDescription>
            </DialogHeader>
            <CourseForm
              form={editForm}
              professors={professors}
              onCancel={() => setIsEditDialogOpen(false)}
              onSubmit={onSubmitEditCourse}
              isSubmitting={updateCourseMutation.isPending}
              mode="edit"
            />
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
