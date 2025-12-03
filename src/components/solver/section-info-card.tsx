import { ChevronsUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import type { SectionAccordionProps } from "./section-accordion.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type SectionInfoCardProps = {
  section: SectionAccordionProps["classes"][0];
};

type StaffMember = NonNullable<
  SectionAccordionProps["classes"][0]["professor"]["preferedStaff"]
>[number];

type StaffPreferenceTableProps = {
  title: string;
  staff?: StaffMember[];
};

function StaffPreferenceTable({ title, staff }: StaffPreferenceTableProps) {
  if (!staff || staff.length === 0) {
    return null;
  }

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>{title}</span>
          <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Toggle {title}</span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-1">
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.roles.join(", ")}</TableCell>
                  <TableCell className="text-right">{s.hours}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SectionInfoCard({ section }: SectionInfoCardProps) {
  const { professor } = section;

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Section Info</CardTitle>
      </CardHeader>

      <CardContent className="space-y-1 text-sm">
        <p>
          <span className="font-medium">Instructor: </span>
          {professor?.name ?? "TBD"}
        </p>
        <p>
          <span className="font-medium">Email: </span>
          {professor?.email ?? "TBD"}
        </p>
        <p>
          <span className="font-medium">Capacity: </span>
          {section.capacity}
        </p>
        <p>
          <span className="font-medium">Enrollment: </span>
          {section.enrollment}
        </p>
        <p>
          <span className="font-medium">Meeting pattern: </span>
          {section.meetingPattern}
        </p>
        <p>
          <span className="font-medium">Academic level: </span>
          {section.academicLevel}
        </p>
        {professor?.comments && (
          <div className="space-y-1">
            <p className="font-medium">Comments</p>
            <p className="whitespace-pre-line">{professor.comments}</p>
          </div>
        )}
        <StaffPreferenceTable
          title={`Professor preferences`}
          staff={professor?.preferedStaff}
        />
        <StaffPreferenceTable
          title={`Professor anti-preferences`}
          staff={professor?.avoidedStaff}
        />
      </CardContent>
    </Card>
  );
}
