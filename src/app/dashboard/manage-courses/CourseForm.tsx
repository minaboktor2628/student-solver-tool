import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AcademicLevel } from "@prisma/client";
import { Combobox } from "@/components/ui/combobox";
import { RefreshCw, Save, BookOpen } from "lucide-react";
import React from "react";

export interface CourseFormProps {
  form: UseFormReturn<any>;
  professors: Array<{ id: string; name?: string | null }>;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  isSubmitting: boolean;
  mode: "add" | "edit";
}

export function CourseForm({
  form,
  professors,
  onCancel,
  onSubmit,
  isSubmitting,
  mode,
}: CourseFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="no-scrollbar -mx-4 max-h-[60vh] space-y-4 overflow-y-auto px-4">
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
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {mode === "add" ? "Adding..." : "Saving..."}
              </>
            ) : (
              <>
                {mode === "add" ? (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Add Course
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
