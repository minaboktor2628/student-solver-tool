"use client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldSeparator } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AcademicLevel } from "@prisma/client";
import { FormInput, FormSelect, FormTextarea } from "@/components/form";
import { SelectItem } from "@/components/ui/select";
import { SectionItemSchema, type SectionItem } from "@/lib/courselisting-api";
import type { User } from "next-auth";

export type CreateSectionFormProps = {
  onSubmit: (data: SectionItem) => void;
  professors: Array<Pick<User, "id" | "name">>;
};

export function CreateSectionForm({
  onSubmit,
  professors,
}: CreateSectionFormProps) {
  const form = useForm({
    resolver: zodResolver(SectionItemSchema),
    mode: "onChange",
    defaultValues: {
      courseTitle: "",
      courseCode: "",
      courseSection: "",
      meetingPattern: "",
      description: "",
      professorId: "",
      professorName: "",
      enrollment: 0,
      capacity: 0,
      requiredHours: 0,
      academicLevel: "UNDERGRADUATE" as AcademicLevel,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="my-2">
      <FieldGroup>
        <FieldGroup className="grid grid-cols-4 gap-4">
          <FormInput
            control={form.control}
            name="courseTitle"
            label="Course Title"
            description='Ex: "Discrete Mathematics"'
          />
          <FormInput
            control={form.control}
            name="courseCode"
            label="Course Code"
            description='Ex: "CS 2022"'
          />
          <FormInput
            control={form.control}
            name="courseSection"
            label="Course Section"
            description='Ex: "LO1"'
          />
          <FormSelect
            control={form.control}
            name="professorId"
            label="Professor"
          >
            {professors.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </FormSelect>
        </FieldGroup>
        <FieldSeparator />
        <FieldGroup className="grid grid-cols-4 gap-4">
          <FormInput
            control={form.control}
            name="enrollment"
            label="Enrollment"
          />
          <FormInput control={form.control} name="capacity" label="Capacity" />
          <FormInput
            control={form.control}
            name="requiredHours"
            label="Required help hours"
          />
          <FormSelect
            control={form.control}
            name="academicLevel"
            label="AcademicLevel"
          >
            {Object.values(AcademicLevel).map((letter) => (
              <SelectItem key={letter} value={letter}>
                {letter}
              </SelectItem>
            ))}
          </FormSelect>
        </FieldGroup>
        <FieldGroup>
          <FormInput
            control={form.control}
            name="meetingPattern"
            label="Meeting Pattern"
            description='Ex: "M-R | 2:00pm - 3:50pm"'
          />
          <FormTextarea
            control={form.control}
            name="description"
            label="Description"
            description="An HTML string"
          />
        </FieldGroup>
        <Button type="submit" disabled={!form.formState.isValid}>
          Submit
        </Button>
      </FieldGroup>
    </form>
  );
}
