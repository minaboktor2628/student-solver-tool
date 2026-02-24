"use client";

import { useState } from "react";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  AlertCircle,
  Plus,
  Calendar,
} from "lucide-react";
import { api } from "@/trpc/react";
import { Role } from "@prisma/client";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AssignmentTable } from "@/components/dashboard/assignment-table";
import { TermCombobox, useTerm } from "@/components/term-combobox";

export default function DashboardContent() {
  const { selectedTerm } = useTerm();

  if (!selectedTerm) throw new Error("No selected term");

  const [showAllStaff, setShowAllStaff] = useState(false);
  const [showAllProfessors, setShowAllProfessors] = useState(false);
  const INITIAL_DISPLAY_COUNT = 8;

  // Dashboard data query
  const [{ courses, staff, professors }] =
    api.dashboard.getDashboardData.useSuspenseQuery({
      termId: selectedTerm.id,
    });

  const publishTermMutation = api.term.publishTerm.useMutation();

  // Publish term
  const publishTerm = async (termId: string) => {
    try {
      const response = await publishTermMutation.mutateAsync({ id: termId });
      if (response.success) {
        toast.success("Term published successfully!");
        window.location.reload(); // Simple reload for now
      } else {
        toast.error("Failed to publish term");
      }
    } catch (err) {
      console.error("Error publishing term:", err);
      toast.error("Failed to publish term");
    }
  };

  // Calculated stats (pre-computed to avoid logic in markup)
  const submittedStaff = staff.filter((s) => s.hasPreferences);
  const submittedProfessors = professors.filter((p) => p.hasPreferences);
  const pendingStaff = staff.filter((s) => !s.hasPreferences);
  const pendingProfessors = professors.filter((p) => !p.hasPreferences);
  const submittedStaffCount = submittedStaff.length;
  const submittedProfessorsCount = submittedProfessors.length;
  const pendingProfessorsCourseCount = pendingProfessors.reduce(
    (sum, p) => sum + p.courseCount,
    0,
  );
  const submittedProfessorsCourseCount = submittedProfessors.reduce(
    (sum, p) => sum + p.courseCount,
    0,
  );
  const staffSubmissionRate =
    staff.length > 0
      ? Math.round((submittedStaffCount / staff.length) * 100)
      : 0;
  const profSubmissionRate =
    professors.length > 0
      ? Math.round((submittedProfessorsCount / professors.length) * 100)
      : 0;
  const totalAvailableHours = staff.reduce(
    (sum, s) => sum + (s?.hours ?? 0),
    0,
  );
  const staffingGap = courses.reduce(
    (sum, c) => sum + Math.max(0, c.requiredHours - c.assignedHours),
    0,
  );
  const hasCompletedSubmissions =
    submittedStaffCount > 0 || submittedProfessorsCount > 0;

  // Helper to format deadline info
  const formatDeadline = (date: Date) => {
    const formatted = date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const daysRemaining = Math.ceil(
      (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return { formatted, daysRemaining };
  };

  const staffDeadline = formatDeadline(selectedTerm.termStaffDueDate);
  const professorDeadline = formatDeadline(selectedTerm.termProfessorDueDate);

  function copyEmailsToClipboard(
    people: Array<{ email?: string | null }>,
  ): void {
    const emails = people
      .map((p) => p.email?.trim())
      .filter((e): e is string => !!e);

    if (emails.length === 0) {
      toast.error("No emails to copy");
      return;
    }

    const text = emails.join(", ");
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(
          `Copied ${emails.length} email${emails.length > 1 ? "s" : ""} to clipboard`,
        );
      })
      .catch(() => {
        toast.error("Failed to copy emails");
      });
  }

  const isSelectedTermPublished = selectedTerm.published;

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1
                className="text-foreground mb-2 text-3xl font-bold sm:text-4xl"
                data-testid="dashboard-heading"
              >
                STS Coordinator Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                {selectedTerm.label} • Submission Tracking & Status
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm">
                <Label className="text-muted-foreground mb-1 block text-xs">
                  Term
                </Label>
                <div className="flex items-center gap-2">
                  <TermCombobox />
                </div>
              </div>
            </div>
          </div>
        </div>

        {!selectedTerm.published && (
          <div className="mb-6">
            <Button onClick={() => publishTerm(selectedTerm.id)} size="default">
              <Calendar className="h-4 w-4" /> Publish Term
            </Button>
            <p className="text-muted-foreground mt-1 text-sm">
              Once published, staff and professors can submit preferences
            </p>
          </div>
        )}

        {isSelectedTermPublished && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>The selected term is published.</CardTitle>
              <CardDescription>
                Here are all the assignments for this term. You can export this
                using the download button.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssignmentTable termId={selectedTerm.id} />
            </CardContent>
          </Card>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <CardContent>
              <div className="mb-2 flex items-center justify-between">
                <Users className="text-primary h-8 w-8" />
                <span className="text-foreground text-2xl font-bold">
                  {submittedStaffCount}/{staff.length}
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                Staff Submissions
              </p>
              <div className="mt-3">
                <Progress value={staffSubmissionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <CardContent>
              <div className="mb-2 flex items-center justify-between">
                <CheckCircle className="text-success h-8 w-8" />
                <span className="text-foreground text-2xl font-bold">
                  {submittedProfessorsCount}/{professors.length}
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                Professor Submissions
              </p>
              <div className="mt-3">
                <Progress value={profSubmissionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <CardContent>
              <div className="mb-2 flex items-center justify-between">
                <Clock className="text-primary h-8 w-8" />
                <span className="text-foreground text-2xl font-bold">
                  {totalAvailableHours}h
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                Total Available Hours
              </p>
              <p className="text-muted-foreground mt-2 text-xs">
                From submitted preferences
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <CardContent>
              <div className="mb-2 flex items-center justify-between">
                <AlertCircle className="text-warning h-8 w-8" />
                <span className="text-foreground text-2xl font-bold">
                  {staffingGap}
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                Staffing Gap
              </p>
              <p className="text-muted-foreground mt-2 text-xs">Hours needed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Pending Submissions Section */}
        <div className="space-y-6">
          {/* Deadline Alerts */}
          {selectedTerm && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 rounded-full p-3">
                      <Clock className="text-primary h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-foreground font-semibold">
                        Staff Deadline
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {staffDeadline.formatted}
                      </p>
                      {staffDeadline.daysRemaining !== null && (
                        <p className="text-primary mt-1 text-xs font-medium">
                          {staffDeadline.daysRemaining} days remaining
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 rounded-full p-3">
                      <Clock className="text-primary h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-foreground font-semibold">
                        Professor Deadline
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {professorDeadline.formatted}
                      </p>
                      {professorDeadline.daysRemaining !== null && (
                        <p className="text-primary mt-1 text-xs font-medium">
                          {professorDeadline.daysRemaining} days remaining
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pending Submissions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Pending Staff */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pending Staff Submissions</CardTitle>
                    <CardDescription className="mt-1">
                      {pendingStaff.length} of {staff.length} awaiting
                      submission
                    </CardDescription>
                  </div>
                  {pendingStaff.length > 0 && (
                    <Button
                      onClick={() => copyEmailsToClipboard(pendingStaff)}
                      size="sm"
                      variant="outline"
                    >
                      <Mail className="h-4 w-4" /> Copy Emails
                    </Button>
                  )}
                </div>
                {pendingStaff.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {([Role.PLA, Role.TA] as const).map((role) => {
                      const roleCount = pendingStaff.filter((s) =>
                        s.roles.includes(role),
                      ).length;
                      if (roleCount === 0) return null;
                      return (
                        <Badge key={role} variant="secondary">
                          {role}: {roleCount} pending
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </CardHeader>
              <Separator />
              <CardContent>
                {pendingStaff.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle className="text-success mx-auto mb-3 h-12 w-12" />
                    <p className="text-foreground mb-1 font-medium">
                      All staff have submitted!
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {staff.length} submissions received
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {pendingStaff
                        .slice(
                          0,
                          showAllStaff ? undefined : INITIAL_DISPLAY_COUNT,
                        )
                        .map((person) => (
                          <div
                            key={person.id}
                            className="hover:bg-muted/80 group border-border bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-all"
                          >
                            <div className="flex-1">
                              <p className="text-foreground font-medium">
                                {person.name}
                              </p>
                              <p className="text-muted-foreground mt-0.5 text-sm">
                                {person.email}
                              </p>
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {person.roles.join(", ")}
                                </Badge>
                              </div>
                            </div>
                            <Badge
                              variant="destructive"
                              className="ml-4 shrink-0 transition-transform group-hover:scale-105"
                            >
                              Not Submitted
                            </Badge>
                          </div>
                        ))}
                    </div>
                    {pendingStaff.length > INITIAL_DISPLAY_COUNT && (
                      <div className="mt-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllStaff(!showAllStaff)}
                          className="w-full"
                        >
                          {showAllStaff ? (
                            <>
                              Show Less
                              <XCircle className="ml-2 h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Show {pendingStaff.length - INITIAL_DISPLAY_COUNT}{" "}
                              More
                              <Plus className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pending Professors */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pending Professor Submissions</CardTitle>
                    <CardDescription className="mt-1">
                      {pendingProfessors.length} of {professors.length} awaiting
                      submission
                    </CardDescription>
                  </div>
                  {pendingProfessors.length > 0 && (
                    <Button
                      onClick={() => copyEmailsToClipboard(pendingProfessors)}
                      size="sm"
                      variant="outline"
                    >
                      <Mail className="h-4 w-4" /> Copy Emails
                    </Button>
                  )}
                </div>
                {pendingProfessors.length > 0 && (
                  <p className="text-muted-foreground mt-4 text-xs">
                    {pendingProfessorsCourseCount} courses affected by pending
                    submissions
                  </p>
                )}
              </CardHeader>
              <Separator />
              <CardContent>
                {pendingProfessors.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle className="text-success mx-auto mb-3 h-12 w-12" />
                    <p className="text-foreground mb-1 font-medium">
                      All professors have submitted!
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {professors.length} submissions received
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {pendingProfessors
                        .slice(
                          0,
                          showAllProfessors ? undefined : INITIAL_DISPLAY_COUNT,
                        )
                        .map((person) => (
                          <div
                            key={person.id}
                            className="hover:bg-muted/80 group border-border bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-all"
                          >
                            <div className="flex-1">
                              <p className="text-foreground font-medium">
                                {person.name}
                              </p>
                              <p className="text-muted-foreground mt-0.5 text-sm">
                                {person.email}
                              </p>
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {person.courseCount}{" "}
                                  {person.courseCount === 1
                                    ? "course"
                                    : "courses"}
                                </Badge>
                              </div>
                            </div>
                            <Badge
                              variant="destructive"
                              className="ml-4 shrink-0 transition-transform group-hover:scale-105"
                            >
                              Not Submitted
                            </Badge>
                          </div>
                        ))}
                    </div>
                    {pendingProfessors.length > INITIAL_DISPLAY_COUNT && (
                      <div className="mt-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setShowAllProfessors(!showAllProfessors)
                          }
                          className="w-full"
                        >
                          {showAllProfessors ? (
                            <>
                              Show Less
                              <XCircle className="ml-2 h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Show{" "}
                              {pendingProfessors.length - INITIAL_DISPLAY_COUNT}{" "}
                              More
                              <Plus className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Completed Submissions Overview */}
          {hasCompletedSubmissions && (
            <Card>
              <CardHeader>
                <CardTitle>Completed Submissions</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Completed Staff */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle className="text-success h-5 w-5" />
                      <h3 className="text-foreground font-medium">
                        Staff ({submittedStaffCount})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {([Role.PLA, Role.TA] as const).map((role) => {
                        const roleStaff = staff.filter(
                          (s) => s.roles.includes(role) && s.hasPreferences,
                        );
                        if (roleStaff.length === 0) return null;
                        return (
                          <div
                            key={role}
                            className="border-success bg-success/5 flex items-center justify-between border-l-2 px-3 py-2"
                          >
                            <span className="text-foreground text-sm font-medium">
                              {role}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {roleStaff.length} submitted
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Completed Professors */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle className="text-success h-5 w-5" />
                      <h3 className="text-foreground font-medium">
                        Professors ({submittedProfessorsCount})
                      </h3>
                    </div>
                    <div className="border-success bg-success/5 border-l-2 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground text-sm font-medium">
                          Total Submissions
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {submittedProfessorsCount} / {professors.length}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Covering {submittedProfessorsCourseCount} courses
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
