"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseForm } from "./CourseForm";
import * as z from "zod";
import type { UseFormReturn } from "react-hook-form";

// Zod schema for validation - exported for use in parent component
export const courseFormSchema = z.object({
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

export type CourseFormValues = z.infer<typeof courseFormSchema>;

export type AddCourseCardProps = {
  isOpen: boolean;
  form: UseFormReturn<CourseFormValues>;
  professors: { id: string; name: string }[];
  onCancel: () => void;
  onSubmit: (values: CourseFormValues) => void | Promise<void>;
  isSubmitting: boolean;
};

export function AddCourseCard({
  isOpen,
  form,
  professors,
  onCancel,
  onSubmit,
  isSubmitting,
}: AddCourseCardProps) {
  if (!isOpen) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add New Course</CardTitle>
      </CardHeader>
      <CardContent>
        <CourseForm
          form={form}
          professors={professors}
          onCancel={onCancel}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          mode="add"
        />
      </CardContent>
    </Card>
  );
}
