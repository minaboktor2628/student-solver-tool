import { CheckIcon, ChevronsUpDown, XIcon } from "lucide-react";
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
import { Badge } from "../ui/badge";

type SectionInfoCardProps = {
  section: SectionAccordionProps["classes"][0];
};

export function SectionInfoCard({ section }: SectionInfoCardProps) {
  const { professor } = section;

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Section Info</CardTitle>
      </CardHeader>

      <CardContent className="space-y-1 text-sm">
        <div>
          <p>
            <span className="font-medium">Instructor: </span>
            {professor?.name ?? "TBD"}
          </p>
          <p>
            <span className="font-medium">Email: </span>
            {professor?.email ?? "TBD"}
          </p>
          <p>
            <span className="font-medium">Comments: </span>
            {professor?.comments ?? "N/A"}
          </p>
        </div>
        <p>
          <span className="font-medium">Enrollment: </span>
          {section.enrollment}/{section.capacity}
        </p>

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>Professor Preferences</span>
              <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="pt-1">
            <div className="overflow-x-auto rounded-md border">
              {/* TODO: add button to quickly add preferred staff to section */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!professor?.preferedStaff && !professor?.avoidedStaff ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-muted-foreground h-10 text-center"
                      >
                        No staff preferences yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {professor?.preferedStaff?.map((s) => (
                        <TableRow
                          key={s.id}
                          title="This staff is a preference of this professor"
                        >
                          <TableCell className="flex items-center gap-2 font-medium">
                            <Badge variant="success" className="px-1">
                              <CheckIcon className="size-4" />
                            </Badge>
                            {s.name}
                          </TableCell>
                          <TableCell>{s.email}</TableCell>
                          <TableCell>{s.roles.join(", ")}</TableCell>
                        </TableRow>
                      ))}
                      {professor?.avoidedStaff?.map((s) => (
                        <TableRow
                          key={s.id}
                          title="This staff is an anti-preference of this professor"
                        >
                          <TableCell className="flex items-center gap-2 font-medium">
                            <Badge variant="destructive" className="px-1">
                              <XIcon className="size-4" />
                            </Badge>
                            {s.name}
                          </TableCell>
                          <TableCell>{s.email}</TableCell>
                          <TableCell>{s.roles.join(", ")}</TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
