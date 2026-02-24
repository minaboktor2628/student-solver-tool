"use client";

import { useState } from "react";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
} from "lucide-react";
import { api } from "@/trpc/react";
import { Role } from "@prisma/client";

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
import { CopyButton } from "@/components/copy-button";
import { PublishTermButton } from "@/components/dashboard/publish-term-button";
import { RefetchButton } from "@/components/refetch-button";
import {
  Banner,
  BannerAction,
  BannerDescription,
  BannerTitle,
} from "@/components/banner";

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

export default function DashboardContent() {
  const { selectedTerm } = useTerm();

  if (!selectedTerm) throw new Error("No selected term");

  const [showAllStaff, setShowAllStaff] = useState(false);
  const [showAllProfessors, setShowAllProfessors] = useState(false);
  const INITIAL_DISPLAY_COUNT = 8;

  const [{ staff, professors, staffingGap }, dashboardDataApi] =
    api.dashboard.getDashboardData.useSuspenseQuery({
      termId: selectedTerm.id,
    });

  const hasCompletedSubmissions =
    staff.submittedCount > 0 || professors.submittedCount > 0;

  const staffDeadline = formatDeadline(selectedTerm.termStaffDueDate);
  const professorDeadline = formatDeadline(selectedTerm.termProfessorDueDate);

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-foreground text-3xl font-bold">
              STS Coordinator Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              {selectedTerm.label} • Submission Tracking & Status
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <Label className="text-muted-foreground mb-1 block text-xs">
              Term
            </Label>
            <div className="flex items-center gap-2">
              <TermCombobox />
              <RefetchButton query={dashboardDataApi} />
            </div>
          </div>
        </div>
      </div>

      {selectedTerm.published ? (
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
      ) : (
        <Banner className="mb-4">
          <AlertCircle />
          <BannerTitle>This term is not published.</BannerTitle>
          <BannerDescription>
            If you have done the assignments, professors and staff cannot yet
            see them.
          </BannerDescription>
          <BannerAction>
            <PublishTermButton termId={selectedTerm.id} />
          </BannerAction>
        </Banner>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <CardContent>
            <div className="mb-2 flex items-center justify-between">
              <Users className="text-primary h-8 w-8" />
              <span className="text-foreground text-2xl font-bold">
                {staff.submittedCount}/{staff.totalCount}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Staff Submissions
            </p>
            <div className="mt-3">
              <Progress value={staff.submissionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <CardContent>
            <div className="mb-2 flex items-center justify-between">
              <CheckCircle className="text-success h-8 w-8" />
              <span className="text-foreground text-2xl font-bold">
                {professors.submissionRate}/{professors.totalCount}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Professor Submissions
            </p>
            <div className="mt-3">
              <Progress value={professors.submissionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <CardContent>
            <div className="mb-2 flex items-center justify-between">
              <Clock className="text-primary h-8 w-8" />
              <span className="text-foreground text-2xl font-bold">
                {staff.totalAvailableHours}h
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
      <div className="space-y-4">
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Pending Staff */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Staff Submissions</CardTitle>
                  <CardDescription className="mt-1">
                    {staff.pending.length} of {staff.totalCount} awaiting
                    submission
                  </CardDescription>
                </div>
                {staff.pending.length > 0 && (
                  <CopyButton
                    value={staff.pending.map((s) => s.email).join(", ")}
                    size="sm"
                    variant="outline"
                  >
                    Copy Emails
                  </CopyButton>
                )}
              </div>
              {staff.pending.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {([Role.PLA, Role.TA] as const).map((role) => {
                    const roleCount = staff.pending.filter((s) =>
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
              {staff.pending.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle className="text-success mx-auto mb-3 h-12 w-12" />
                  <p className="text-foreground mb-1 font-medium">
                    All staff have submitted!
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {staff.totalCount} submissions received
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {staff.pending
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
                  {staff.pending.length > INITIAL_DISPLAY_COUNT && (
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
                            Show {staff.pending.length - INITIAL_DISPLAY_COUNT}{" "}
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
                    {professors.pending.length} of {professors.totalCount}{" "}
                    awaiting submission
                  </CardDescription>
                </div>
                {professors.pending.length > 0 && (
                  <CopyButton
                    value={professors.pending.map((p) => p.email).join(", ")}
                    size="sm"
                    variant="outline"
                  >
                    Copy Emails
                  </CopyButton>
                )}
              </div>
              {professors.pending.length > 0 && (
                <p className="text-muted-foreground mt-4 text-xs">
                  {professors.pendingCourseCount} courses affected by pending
                  submissions
                </p>
              )}
            </CardHeader>
            <Separator />
            <CardContent>
              {professors.pending.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle className="text-success mx-auto mb-3 h-12 w-12" />
                  <p className="text-foreground mb-1 font-medium">
                    All professors have submitted!
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {professors.totalCount} submissions received
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {professors.pending
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
                  {professors.pending.length > INITIAL_DISPLAY_COUNT && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllProfessors(!showAllProfessors)}
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
                            {professors.pending.length - INITIAL_DISPLAY_COUNT}{" "}
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
                      Staff ({staff.submittedCount})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {([Role.PLA, Role.TA] as const).map((role) => {
                      const roleStat = staff.roleStats[role];
                      if (!roleStat || roleStat.submitted === 0) return null;
                      return (
                        <div
                          key={role}
                          className="border-success bg-success/5 flex items-center justify-between border-l-2 px-3 py-2"
                        >
                          <span className="text-foreground text-sm font-medium">
                            {role}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {roleStat.submitted} submitted
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
                      Professors ({professors.submittedCount})
                    </h3>
                  </div>
                  <div className="border-success bg-success/5 border-l-2 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground text-sm font-medium">
                        Total Submissions
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {professors.submittedCount} / {professors.totalCount}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Covering {professors.submittedCourseCount} courses
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
