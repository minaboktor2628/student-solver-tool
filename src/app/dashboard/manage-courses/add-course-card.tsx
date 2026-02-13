"use client";

import { AcademicLevel } from "@prisma/client";
import { type UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { RefreshCw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
              control={form.control}
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
                control={form.control}
                name="academicLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Level</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
              control={form.control}
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
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
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
