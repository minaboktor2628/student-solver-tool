import { useState } from "react";
import { Input } from "./ui/input";
import { AssistantItem } from "./assistant-item";

export type StudentSelectionSidebarProps = {
  sectionName: string | undefined;
  students: {
    id: string;
    name: string;
    role: "PLA" | "TA";
    hours: number;
    comments: string;
    preferences: [string, string, string];
  }[];
};

export function StudentSelectionSidebar({
  students,
  sectionName,
}: StudentSelectionSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!sectionName)
    return (
      <h2 className="text-center text-lg font-semibold">
        No section selected!
      </h2>
    );

  return (
    <div className="mx-0.5">
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search assistants..."
      />
      <ul className="py-4">
        {students.map((s) => (
          <li key={s.id}>
            <AssistantItem {...s} />
          </li>
        ))}
      </ul>
    </div>
  );
}
