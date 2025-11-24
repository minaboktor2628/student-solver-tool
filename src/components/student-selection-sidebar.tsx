import { useState } from "react";
import { Input } from "./ui/input";
import { AssistantItem } from "./assistant-item";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "./loading-spinner";
import { Separator } from "./ui/separator";

export type StudentSelectionSidebarProps = {
  sectionId: string | undefined;
};

export function StudentSelectionSidebar({
  sectionId,
}: StudentSelectionSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const students = api.staff.getQualifiedStaffForCourse.useQuery({
    sectionId,
  });

  if (!sectionId)
    return (
      <h2 className="text-center text-lg font-semibold">
        No section selected!
      </h2>
    );

  if (students.isPending) return <LoadingSpinner />;
  if (students.isError) return <>error</>;

  return (
    <div className="mx-0.5">
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search assistants..."
      />
      <p className="text-muted-foreground p-1 text-sm">
        {students.data.count} qualified staff
      </p>
      <ul className="space-y-1 py-4">
        {students.data.available.map((s) => (
          <li key={s.id}>
            <AssistantItem {...s} isAvailable={true} />
          </li>
        ))}
        {students.data.alreadyAssigned.map((s) => (
          <li key={s.id}>
            <AssistantItem {...s} isAvailable={false} />
          </li>
        ))}
      </ul>
    </div>
  );
}
