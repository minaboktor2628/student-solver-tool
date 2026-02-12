"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, type RouterOutputs } from "@/trpc/react";
import type { TermLetter } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlobalSuspense } from "@/components/global-suspense";
import { Input } from "@/components/ui/input";
import { RefreshCwIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";
import type { SectionItem } from "@/lib/courselisting-api";
import { CreateSectionForm } from "@/components/dashboard/add-section-form";

type SyncSectionsFormProps = {
  year: number;
  termLetter: TermLetter;
};

export function SyncSectionsForm({ year, termLetter }: SyncSectionsFormProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Sync Sections
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            Sync sections for term {year} {termLetter}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="api">
          <TabsList>
            <TabsTrigger value="api">From API</TabsTrigger>
            <TabsTrigger value="csv">From CSV</TabsTrigger>
            <TabsTrigger value="form">Add one course</TabsTrigger>
          </TabsList>
          <TabsContent value="api">
            <GlobalSuspense>
              <CourseListingApiFormContent
                termLetter={termLetter}
                year={year}
              />
            </GlobalSuspense>
          </TabsContent>
          <TabsContent value="csv">TODO</TabsContent>
          <TabsContent value="form">
            <GlobalSuspense>
              <OneCourseForm termLetter={termLetter} year={year} />
            </GlobalSuspense>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function OneCourseForm({ year, termLetter }: SyncSectionsFormProps) {
  const [professors] = api.user.getAllProfessors.useSuspenseQuery();
  const utils = api.useUtils();
  const addSectionsApi = api.term.addSectionsToTerm.useMutation({
    onSuccess() {
      toast.success("Added course!");
    },
    onError(error) {
      toast.error(error.message);
    },
    async onSettled() {
      await utils.term.invalidate();
    },
  });

  function handleSubmit(data: SectionItem) {
    addSectionsApi.mutate({
      year,
      termLetter,
      sections: [data],
    });
  }

  return (
    <div className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
      <Card>
        <CardContent>
          <CreateSectionForm onSubmit={handleSubmit} professors={professors} />
        </CardContent>
      </Card>
    </div>
  );
}

function CourseListingApiFormContent({
  year,
  termLetter,
}: SyncSectionsFormProps) {
  const utils = api.useUtils();
  const [{ sections }, courselistingApi] =
    api.term.getCourseListingData.useSuspenseQuery({
      year,
      termLetter,
    });

  const addSectionsApi = api.term.addSectionsToTerm.useMutation({
    onSuccess() {
      toast.success("Added courses!");
    },
    onError(error) {
      toast.error(error.message);
    },
    async onSettled() {
      await utils.term.invalidate();
    },
  });

  const anyProfessorsNotCreatedYet = sections.some(
    (c) => !c.professorIsAllowedOnTerm,
  );

  async function handleRefetch() {
    await utils.term.getCourseListingData.refetch({ year, termLetter });
  }

  function handleSubmit() {
    addSectionsApi.mutate({
      year,
      termLetter,
      sections,
      replaceExisting: true,
    });
  }

  function handleDelete(key: string) {
    utils.term.getCourseListingData.setData({ year, termLetter }, (old) => {
      if (!old) return old;

      const { sections, allProfessors } = old;
      return {
        sections: sections.filter(
          (section) =>
            key !==
            section.courseSection + section.courseCode + section.courseTitle,
        ),
        allProfessors,
      };
    });
  }

  function handleRequiredHoursChange(key: string, hours: number) {
    utils.term.getCourseListingData.setData({ year, termLetter }, (old) => {
      if (!old) return old;

      const { sections, allProfessors } = old;
      return {
        sections: sections.map((section) =>
          key ===
          section.courseSection + section.courseCode + section.courseTitle
            ? { ...section, requiredHours: hours }
            : section,
        ),
        allProfessors,
      };
    });
  }

  return (
    <div className="flex flex-col space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Course listing API data</CardTitle>
          <CardDescription className="flex flex-row">
            <p>
              This data is pulled from{" "}
              <a
                href="https://courselistings.wpi.edu/"
                target="_blank"
                className="hover:underline"
              >
                https://courselistings.wpi.edu
              </a>
              . The required hours are how much staff hours are allocated for
              this course.
              <br />
              NOTE: submitting this data will delete all the current sections in
              the database.
            </p>
            <Button
              onClick={handleRefetch}
              disabled={courselistingApi.isRefetching}
              className="ml-auto w-fit"
              size="sm"
            >
              <RefreshCwIcon
                className={courselistingApi.isRefetching ? "animate-spin" : ""}
              />{" "}
              Re-fetch
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
            <SectionTable
              courses={sections}
              onRequiredHoursChange={handleRequiredHoursChange}
              onDelete={handleDelete}
            />
          </div>
        </CardContent>
      </Card>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>Submit</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              all the current linked sections to this term and override them
              with these sections.
              {anyProfessorsNotCreatedYet &&
                " There are professors who have not yet been added to this term. This means that some sections you are about to submit will have no professor."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SectionTable({
  courses,
  onRequiredHoursChange,
  onDelete,
}: {
  courses: RouterOutputs["term"]["getCourseListingData"]["sections"];
  onRequiredHoursChange: (key: string, hours: number) => void;
  onDelete: (key: string) => void;
}) {
  return (
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead></TableHead>
          <TableHead className="w-[200px]">Title</TableHead>
          <TableHead>Professor Name</TableHead>
          <TableHead className="text-right">Enrollment</TableHead>
          <TableHead className="text-right">Required Hours</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map(
          ({
            courseTitle,
            courseCode,
            courseSection,
            enrollment,
            requiredHours,
            capacity,
            professorName,
            professorIsAllowedOnTerm,
          }) => (
            <TableRow key={courseSection + courseCode + courseTitle}>
              <TableCell
                title={
                  !professorIsAllowedOnTerm
                    ? "Professor has not yet been added to this term."
                    : ""
                }
              >
                {!professorIsAllowedOnTerm && (
                  <TriangleAlertIcon className="text-destructive size-5" />
                )}
              </TableCell>
              <TableCell
                className="max-w-[450px] truncate whitespace-nowrap"
                title={`${courseCode}-${courseSection} ${courseTitle}`}
              >
                {courseCode}-{courseSection} {courseTitle}
              </TableCell>
              <TableCell
                title={
                  !professorIsAllowedOnTerm
                    ? "Professor has not yet been added to this term."
                    : ""
                }
                className={
                  !professorIsAllowedOnTerm
                    ? "text-muted-foreground line-through"
                    : ""
                }
              >
                {professorName}
              </TableCell>
              <TableCell className="text-right">
                {enrollment}/{capacity}
              </TableCell>
              <TableCell className="text-right">
                <Input
                  type="number"
                  min={0}
                  step={10}
                  className="inline-block w-28"
                  value={requiredHours}
                  onChange={(e) =>
                    onRequiredHoursChange(
                      courseSection + courseCode + courseTitle,
                      Number(e.target.value),
                    )
                  }
                />
              </TableCell>

              {/* TODO: Add edit button to perhaps select a different prof for that course */}
              <TableCell className="flex flex-row items-end justify-end space-x-2">
                <button
                  className="inline-block cursor-pointer"
                  onClick={() =>
                    onDelete(courseSection + courseCode + courseTitle)
                  }
                >
                  <Trash2Icon className="text-destructive inline-block size-5" />
                </button>
              </TableCell>
            </TableRow>
          ),
        )}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={5}>Number of courses</TableCell>
          <TableCell className="text-right">{courses.length}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={5}>Number of help hours needed</TableCell>
          <TableCell className="text-right">
            {courses.reduce((acc, val) => acc + val.requiredHours, 0)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
