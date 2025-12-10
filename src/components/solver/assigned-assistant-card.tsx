import type { RouterInputs } from "@/trpc/react";
import type { SectionAccordionProps } from "./section-accordion.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Droppable } from "../droppable";
import { Toggle } from "../ui/toggle";
import { CircleAlertIcon, LockIcon, UnlockIcon, XIcon } from "lucide-react";
import { Draggable } from "../draggable";
import { StaffItem } from "./staff-item";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function AssignedAssistantsCard({
  section,
  onToggleAssignmentLock,
  onUnassign,
}: {
  section: SectionAccordionProps["classes"][0];
  onToggleAssignmentLock: (
    input: RouterInputs["staffAssignment"]["toggleAssignmentLock"],
  ) => void;
  onUnassign: (input: RouterInputs["staffAssignment"]["remove"]) => void;
}) {
  return (
    <Card className="flex-5">
      <CardHeader>
        <CardTitle>Assigned Assistants</CardTitle>
      </CardHeader>
      <CardContent className="h-full">
        <Droppable
          id={section.id}
          className="h-full"
          data={{
            action: "assign",
            code: section.courseCode + "-" + section.courseSection,
          }}
        >
          <ul className="space-y-2">
            {section.staff.map((staff) => (
              <li
                key={staff.id}
                className="flex flex-row items-center space-x-2"
              >
                <Toggle
                  variant="outline"
                  aria-label="Toggle lock"
                  title={`Lock/unlock ${staff.name} to ${section.courseCode}`}
                  pressed={staff.locked}
                  onPressedChange={() =>
                    onToggleAssignmentLock({
                      sectionId: section.id,
                      staffId: staff.id,
                    })
                  }
                >
                  {staff.locked ? <LockIcon /> : <UnlockIcon />}
                </Toggle>
                <Draggable id={staff.id} data={{ staff }} className="flex-1">
                  <StaffItem {...staff}>
                    {!staff.flags.notAvoidedByProfessor && (
                      <Tooltip>
                        <TooltipTrigger className="self-center">
                          <CircleAlertIcon className="text-destructive size-6" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Staff is an anti-preference of the professor
                            teaching this section.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {!staff.flags.qualifiedForThisSection && (
                      <Tooltip>
                        <TooltipTrigger className="self-center">
                          <CircleAlertIcon className="text-destructive size-6" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Staff has reported that they are unqualified for
                            this section.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </StaffItem>
                </Draggable>
                <Button
                  size="icon"
                  variant="destructive"
                  title={`Unassign ${staff.name} from ${section.courseCode}`}
                  onClick={() =>
                    onUnassign({
                      sectionId: section.id,
                      staffId: staff.id,
                    })
                  }
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
        </Droppable>
      </CardContent>
    </Card>
  );
}
