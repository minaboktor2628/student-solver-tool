"use client";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, MoreHorizontal, RefreshCw, Save, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type z from "zod";
import type { CourseRow } from "./columns";
import { SectionItemSchema } from "@/lib/courselisting-api";
import { SingleSectionForm } from "@/components/dashboard/single-section-form";

export function CourseTableRowAction({ course }: { course: CourseRow }) {
  const utils = api.useUtils();
  const [professors] = api.user.getAllProfessors.useSuspenseQuery();
  const deleteCourseMutation = api.courses.deleteCourse.useMutation({
    onSuccess: async () => {
      toast.success("Course deleted successfully!");
      await utils.courses.getAllCourses.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateCourseMutation = api.courses.updateCourse.useMutation({
    onSuccess: async () => {
      toast.success("Course updated successfully!");
      await utils.courses.getAllCourses.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function handleDelete() {
    deleteCourseMutation.mutate({ id: course.id });
  }

  function onEdit(data: z.infer<typeof SectionItemSchema>) {
    updateCourseMutation.mutate({ id: course.id, data });
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
          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="h-4 w-4" /> Edit course
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-6xl">
              <DialogHeader>
                <DialogTitle>Edit course</DialogTitle>
                <DialogDescription>All fields are required</DialogDescription>
              </DialogHeader>
              <SingleSectionForm
                onSubmit={onEdit}
                professors={professors}
                defaultValues={{
                  ...course,
                  professorName: course.professorName,
                  professorId: course.professorId,
                }}
              />
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
