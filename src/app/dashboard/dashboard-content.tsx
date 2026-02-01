"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  AlertCircle,
  RefreshCw,
  Database,
  Plus,
  Trash2,
  Calendar,
  Eye,
  UserPlus,
  BookOpen,
} from "lucide-react";
import { api } from "@/trpc/react";
import type { Section, User, Term, TermLetter } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { toast } from "sonner";

type RouterOutputs = inferRouterOutputs<AppRouter>;
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Course = Pick<
  Section,
  | "id"
  | "courseCode"
  | "courseTitle"
  | "enrollment"
  | "capacity"
  | "requiredHours"
  | "description"
> & {
  assignedStaff: number;
  professorName: string;
  term: string;
  isGradSemesterCourse?: boolean;
  isDisplayOnly?: boolean;
  spansTerms?: string | null;
};

type StaffMember = Pick<User, "id" | "name" | "email" | "hours"> & {
  role: string;
  submitted: boolean;
};

type Professor = Pick<User, "id" | "name" | "email"> & {
  submitted: boolean;
  courseCount: number;
};

type TermData = Pick<
  Term,
  "id" | "termLetter" | "year" | "termStaffDueDate" | "termProfessorDueDate"
> & {
  name: string;
  staffDueDate: string;
  professorDueDate: string;
  status: "draft" | "published";
};

type GetTermsResponse = RouterOutputs["term"]["getAllTerms"]["terms"][number];
type GetDashboardResponse = RouterOutputs["dashboard"]["getDashboardData"];

const LOCAL_TERMS_KEY = "sata:terms";

const parseStoredTerms = (raw: string | null): string[] | null => {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const terms = parsed.filter(
      (item): item is string => typeof item === "string",
    );
    return terms.length > 0 ? terms : null;
  } catch {
    return null;
  }
};

export default function DashboardContent() {
  const [selectedView, setSelectedView] = useState("overview");
  const [courses, setCourses] = useState<Course[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [terms, setTerms] = useState<TermData[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [loadingTerms, setLoadingTerms] = useState(false);

  const getTermsQuery = api.term.getAllTerms.useQuery(undefined, {
    enabled: false,
  });
  const getDashboardQuery = api.dashboard.getDashboardData.useQuery(
    { termId: selectedTerm ?? "" },
    { enabled: !!selectedTerm },
  );
  const deleteTermMutation = api.term.deleteTerm.useMutation();
  const publishTermMutation = api.term.publishTerm.useMutation();
  const syncCoursesMutation = api.courses.syncCourses.useMutation();

  // Initialize terms from API
  useEffect(() => {
    void fetchTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTerms = async () => {
    setLoadingTerms(true);
    try {
      const { data } = await getTermsQuery.refetch();
      if (data) {
        const formattedTerms = data.terms.map((term: GetTermsResponse) => {
          const status: TermData["status"] = term.active
            ? "published"
            : "draft";
          return {
            id: term.id ?? "",
            name: term.name ?? "",
            termLetter: term.termLetter ?? "A",
            year: term.year ?? new Date().getFullYear(),
            termStaffDueDate: new Date(term.staffDueDate ?? ""),
            termProfessorDueDate: new Date(term.professorDueDate ?? ""),
            staffDueDate: term.staffDueDate ?? "",
            professorDueDate: term.professorDueDate ?? "",
            status,
          };
        });
        setTerms(formattedTerms);

        // Select active term if it exists, otherwise select first term
        const activeTerm = formattedTerms.find((t) => t.status === "published");
        if (activeTerm) {
          setSelectedTerm(activeTerm.id);
        } else if (formattedTerms.length > 0 && formattedTerms[0]) {
          setSelectedTerm(formattedTerms[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching terms:", err);
      // Fallback to local storage if API fails
      const raw = localStorage.getItem(LOCAL_TERMS_KEY);
      const parsed = parseStoredTerms(raw);
      if (parsed && parsed.length > 0 && parsed[0]) {
        setTerms(
          parsed.map((name) => ({
            id: name,
            name,
            termLetter: "A" as TermLetter,
            year: new Date().getFullYear(),
            termStaffDueDate: new Date(),
            termProfessorDueDate: new Date(),
            staffDueDate: "",
            professorDueDate: "",
            status: "published" as const,
          })),
        );
        setSelectedTerm(parsed[0]);
      }
      // If no fallback available, terms stay empty
    } finally {
      setLoadingTerms(false);
    }
  };

  // Fetch dashboard data when term changes
  useEffect(() => {
    if (selectedTerm) {
      void fetchDashboardData(selectedTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTerm]);

  const fetchDashboardData = async (termId: string) => {
    setIsLoading(true);
    try {
      const { data } = await getDashboardQuery.refetch();

      if (!data) {
        console.error("Dashboard API error");
        toast.error("Dashboard API error");
        setCourses([]);
        setStaff([]);
        setProfessors([]);
        return;
      }

      // Transform courses with graduate semester course handling
      const transformedCourses = (data.courses ?? []).map(
        (course: GetDashboardResponse["courses"][number]) => {
          // Check if it's a graduate semester course
          const isGradSemester =
            course.description.includes("GRAD_SEMESTER") ?? false;
          const isDisplayOnly =
            course.description.includes("GRAD_SEMESTER_SECONDARY") ?? false;

          // Debug logging for ALL courses to see what we're getting
          console.log(
            `Course: ${course.courseCode} - Description: "${course.description}" - isGradSemester: ${isGradSemester} - isDisplayOnly: ${isDisplayOnly}`,
          );

          // Determine term display - computed from current selected term
          let termDisplay =
            terms.find((t) => t.id === termId)?.name ?? "Unknown Term";
          let spansTerms = null;

          if (isGradSemester) {
            // Extract which terms it spans
            const currentTermLetter =
              terms.find((t) => t.id === termId)?.termLetter ?? "";

            if (currentTermLetter === "A" || currentTermLetter === "B") {
              spansTerms = "A+B";
              termDisplay = `A+B Terms ${terms.find((t) => t.id === termId)?.year ?? ""}`;
            } else if (currentTermLetter === "C" || currentTermLetter === "D") {
              spansTerms = "C+D";
              termDisplay = `C+D Terms ${terms.find((t) => t.id === termId)?.year ?? ""}`;
            }

            // For display-only sections, show special term info
            if (isDisplayOnly) {
              termDisplay = `${spansTerms} Terms (Display Only)`;
            }
          }

          return {
            id: course.id ?? "",
            courseCode: course.courseCode ?? "",
            courseTitle: course.courseTitle ?? "",
            enrollment: course.enrollment ?? 0,
            capacity: course.capacity ?? 0,
            requiredHours: isDisplayOnly ? 0 : (course.requiredHours ?? 0), // 0 for display-only
            assignedStaff: course.assignedHours ?? 0,
            professorName: course.professorName ?? "",
            term: termDisplay,
            description: course.description,
            isGradSemesterCourse: isGradSemester,
            isDisplayOnly: isDisplayOnly,
            spansTerms: spansTerms,
          };
        },
      );

      setCourses(transformedCourses);
      setStaff(
        (data.staff ?? []).map((s) => ({
          id: s.id,
          name: s.name ?? "",
          email: s.email ?? "",
          hours: 0,
          role: s.roles?.[0] ?? "PLA",
          submitted: s.hasPreferences,
        })),
      );
      setProfessors(
        (data.professors ?? []).map((p) => ({
          id: p.id,
          name: p.name ?? "",
          email: p.email ?? "",
          courseCount: p.courseCount ?? 0,
          submitted: p.hasPreferences ?? false,
        })),
      );
    } catch (err: unknown) {
      console.error("Error fetching dashboard data:", err);
      toast.error("Failed to load dashboard data");
      setCourses([]);
      setStaff([]);
      setProfessors([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Publish term
  const publishTerm = async (termId: string) => {
    try {
      const response = await publishTermMutation.mutateAsync({ id: termId });

      if (response.success) {
        toast.success("Term published successfully!");
        void fetchTerms();
      } else {
        toast.error("Failed to publish term");
      }
    } catch (err) {
      console.error("Error publishing term:", err);
      toast.error("Failed to publish term");
    }
  };

  // Delete term
  const deleteTerm = async (termId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this term? This will delete all associated courses, preferences, and assignments. This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await deleteTermMutation.mutateAsync({ id: termId });

      if (response.success) {
        toast.success("Term deleted successfully!");
        void fetchTerms();
        // If we deleted the selected term, select the first available term
        if (selectedTerm === termId) {
          const updatedTerms = terms.filter((t) => t.id !== termId);
          setSelectedTerm(
            updatedTerms.length > 0 && updatedTerms[0]
              ? updatedTerms[0].id
              : null,
          );
        }
      } else {
        toast.error("Failed to delete term");
      }
    } catch (err) {
      console.error("Error deleting term:", err);
      toast.error("Failed to delete term");
    }
  };

  // Sync courses function (existing)
  const syncCoursesFromWPI = async () => {
    setIsSyncing(true);
    try {
      const response = await syncCoursesMutation.mutateAsync();
      if (response && (response.success ?? response.created !== undefined)) {
        toast.success(
          `Synced! Created: ${response.created ?? 0}, Updated: ${response.updated ?? 0}, Skipped: ${response.skipped ?? 0}`,
        );
        if (selectedTerm) {
          await fetchDashboardData(selectedTerm);
        }
      } else {
        toast.error("Sync failed");
      }
    } catch (err: unknown) {
      console.error("Error syncing courses:", err);
      toast.error("Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculated stats (existing)
  const pendingStaff = staff.filter((s) => !s.submitted);
  const pendingProfessors = professors.filter((p) => !p.submitted);
  const staffSubmissionRate =
    staff.length > 0
      ? Math.round(
          (staff.filter((s) => s.submitted).length / staff.length) * 100,
        )
      : 0;
  const profSubmissionRate =
    professors.length > 0
      ? Math.round(
          (professors.filter((p) => p.submitted).length / professors.length) *
            100,
        )
      : 0;
  const totalAvailableHours = staff.reduce((sum, s) => sum + (s.hours ?? 0), 0);
  const staffingGap = courses
    .filter((c) => !c.isDisplayOnly)
    .reduce(
      (sum, c) => sum + Math.max(0, c.requiredHours - c.assignedStaff),
      0,
    );

  // Loading UI
  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="text-primary h-8 w-8 animate-spin" />
          <span className="text-muted-foreground text-lg">
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

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

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-foreground mb-2 text-3xl font-bold sm:text-4xl">
                STS Coordinator Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                {selectedTerm
                  ? `${terms.find((t) => t.id === selectedTerm)?.name ?? selectedTerm} • Course Assignment Overview`
                  : "Select a term"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm">
                <Label className="text-muted-foreground mb-1 block text-xs">
                  Term
                </Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedTerm ?? ""}
                    onValueChange={(value) =>
                      setSelectedTerm(value === "" ? null : value)
                    }
                    disabled={loadingTerms}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue
                        placeholder={loadingTerms ? "Loading…" : "Select term"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {!loadingTerms &&
                        terms.map((term) => (
                          <SelectItem key={term.id} value={term.id}>
                            {term.name ?? ""}{" "}
                            {term.status === "draft" && "(Draft)"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {selectedTerm && (
                    <Button
                      onClick={() => deleteTerm(selectedTerm)}
                      size="sm"
                      title="Delete term"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}

                  <Button asChild size="sm">
                    <Link href="/dashboard/create-term">
                      <Plus className="h-4 w-4" /> Create Term
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedTerm &&
          terms.find((t) => t.id === selectedTerm)?.status === "draft" && (
            <div className="mb-6">
              <Button onClick={() => publishTerm(selectedTerm)} size="default">
                <Calendar className="h-4 w-4" /> Publish Term
              </Button>
              <p className="text-muted-foreground mt-1 text-sm">
                Once published, staff and professors can submit preferences
              </p>
            </div>
          )}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="px-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <Users className="text-primary h-8 w-8" />
              <span className="text-foreground text-2xl font-bold">
                {staff.filter((s) => s.submitted).length}/{staff.length}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Staff Submissions
            </p>
            <div className="mt-3">
              <Progress value={staffSubmissionRate} className="h-2" />
            </div>
          </Card>

          <Card className="px-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <CheckCircle className="text-success h-8 w-8" />
              <span className="text-foreground text-2xl font-bold">
                {professors.filter((p) => p.submitted).length}/
                {professors.length}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Professor Submissions
            </p>
            <div className="mt-3">
              <Progress value={profSubmissionRate} className="h-2" />
            </div>
          </Card>

          <Card className="px-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
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
          </Card>

          <Card className="px-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
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
          </Card>
        </div>

        <div className="border-border mb-6 flex flex-wrap items-center justify-between gap-4">
          <Tabs
            value={selectedView}
            onValueChange={(value) => setSelectedView(value)}
            className="border-border gap-0 border-b"
          >
            <TabsList className="bg-transparent p-0">
              {[
                { value: "overview", label: "Overview" },
                { value: "pending", label: "Pending" },
                { value: "courses", label: "Courses" },
              ].map((view) => (
                <TabsTrigger
                  key={view.value}
                  value={view.value}
                  className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-3 capitalize data-[state=active]:bg-transparent"
                >
                  {view.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3">
            {/* User Management Button - Shows in all views */}
            <Button asChild size="sm">
              <Link href="/dashboard/manage-users">
                <UserPlus className="h-4 w-4" /> Manage Users
              </Link>
            </Button>

            {/* Course Management Button - Shows in courses view or always */}
            <Button asChild size="sm">
              <Link href="/dashboard/manage-courses">
                <BookOpen className="h-4 w-4" /> Manage Courses
              </Link>
            </Button>

            {selectedView === "courses" && (
              <Button
                onClick={syncCoursesFromWPI}
                disabled={isSyncing}
                size="sm"
              >
                <Database
                  className={`h-4 w-4 ${isSyncing ? "animate-pulse" : ""}`}
                />
                {isSyncing ? "Syncing..." : "Sync from WPI"}
              </Button>
            )}
          </div>
        </div>

        {selectedView === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="px-6">
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Staff by Role
              </h2>
              <div className="space-y-3">
                {["PLA", "TA", "GLA"].map((role) => {
                  const roleStaff = staff.filter((s) => s.role === role);
                  const submitted = roleStaff.filter((s) => s.submitted).length;
                  const total = roleStaff.length;
                  return (
                    <div
                      key={role}
                      className="flex items-center justify-between"
                    >
                      <span className="text-foreground font-medium">
                        {role}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground text-sm">
                          {submitted}/{total} submitted
                        </span>
                        <Progress
                          value={total > 0 ? (submitted / total) * 100 : 0}
                          className="h-2 w-32"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="px-6">
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Course Staffing Status
              </h2>
              <div className="space-y-2">
                {courses
                  .filter((course) => !course.isDisplayOnly)
                  .map((course) => {
                    const percentage =
                      (course.assignedStaff / course.requiredHours) * 100;
                    const isUnderstaffed =
                      course.assignedStaff < course.requiredHours;
                    return (
                      <div
                        key={course.id}
                        className="border-border border-b pb-2"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-foreground flex items-center gap-1 text-sm font-medium">
                            {course.courseCode}
                            {course.isGradSemesterCourse && (
                              <span className="text-primary text-xs">
                                ({course.spansTerms})
                              </span>
                            )}
                          </span>
                          <span
                            className={`text-sm ${isUnderstaffed ? "text-warning" : "text-success"}`}
                          >
                            {course.assignedStaff}/{course.requiredHours}h
                          </span>
                        </div>
                        <Progress
                          value={Math.min(percentage, 100)}
                          className={`h-1.5 ${isUnderstaffed ? "bg-warning/20" : "bg-success/20"}`}
                        />
                      </div>
                    );
                  })}
              </div>
            </Card>
          </div>
        )}

        {selectedView === "pending" && (
          <div className="space-y-6">
            <Card className="px-6">
              <div className="border-border border-b pb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-foreground text-xl font-semibold">
                    Pending Staff Submissions ({pendingStaff.length})
                  </h2>
                  {pendingStaff.length > 0 && (
                    <Button
                      onClick={() => copyEmailsToClipboard(pendingStaff)}
                      size="sm"
                    >
                      <Mail className="h-4 w-4" /> Copy Emails
                    </Button>
                  )}
                </div>
              </div>
              {pendingStaff.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  All staff have submitted their preferences! 🎉
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingStaff.map((person) => (
                    <div
                      key={person.id}
                      className="bg-muted flex items-center justify-between rounded-lg p-3"
                    >
                      <div>
                        <p className="text-foreground font-medium">
                          {person.name}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {person.email} • {person.role}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        <XCircle className="h-4 w-4" />
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="px-6">
              <div className="border-border border-b pb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-foreground text-xl font-semibold">
                    Pending Professor Submissions ({pendingProfessors.length})
                  </h2>
                  {pendingProfessors.length > 0 && (
                    <Button
                      onClick={() => copyEmailsToClipboard(pendingProfessors)}
                      size="sm"
                    >
                      <Mail className="h-4 w-4" /> Copy Emails
                    </Button>
                  )}
                </div>
              </div>
              {pendingProfessors.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  All professors have submitted their preferences! 🎉
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingProfessors.map((person) => (
                    <div
                      key={person.id}
                      className="bg-muted flex items-center justify-between rounded-lg p-3"
                    >
                      <div>
                        <p className="text-foreground font-medium">
                          {person.name}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {person.email} • {person.courseCount} courses
                        </p>
                      </div>
                      <Badge variant="destructive">
                        <XCircle className="h-4 w-4" />
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {selectedView === "courses" && (
          <Card className="px-6">
            <div className="border-border border-b pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-foreground text-xl font-semibold">
                    Course Details
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {courses.filter((c) => !c.isDisplayOnly).length} CS courses
                    in database
                    {courses.filter((c) => c.isDisplayOnly).length > 0 && (
                      <span className="text-muted-foreground ml-2">
                        (+{courses.filter((c) => c.isDisplayOnly).length}{" "}
                        display-only)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Course
                    </th>
                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Professor
                    </th>
                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Enrollment
                    </th>
                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Hours Needed
                    </th>
                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Assigned
                    </th>
                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {courses.map((course) => {
                    console.log(
                      `Table rendering: ${course.courseCode} - isDisplayOnly: ${course.isDisplayOnly}`,
                    );
                    return (
                      <tr
                        key={course.id}
                        className={`hover:bg-muted/50 transition-colors ${
                          course.isGradSemesterCourse
                            ? course.isDisplayOnly
                              ? "bg-muted/30"
                              : "bg-primary/10"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <div className="text-foreground text-sm font-medium">
                                {course.courseCode}
                              </div>
                              {course.isGradSemesterCourse &&
                                !course.isDisplayOnly && (
                                  <Badge variant="default">
                                    <Calendar className="mr-1 h-3 w-3" />
                                    Semester ({course.spansTerms})
                                  </Badge>
                                )}
                              {course.isDisplayOnly && (
                                <Badge variant="outline">
                                  <Eye className="mr-1 h-3 w-3" />
                                  Display Only
                                </Badge>
                              )}
                            </div>
                            <div className="text-muted-foreground mt-1 text-sm">
                              {course.courseTitle}
                              {course.isDisplayOnly && (
                                <span className="text-muted-foreground ml-2 text-xs">
                                  (Assigned in{" "}
                                  {course.spansTerms === "A+B" ? "A" : "C"}{" "}
                                  Term)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-foreground text-sm">
                            {course.professorName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-foreground text-sm">
                            {course.enrollment}/{course.capacity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {course.isDisplayOnly ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className="text-foreground">
                              {course.requiredHours}h
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {course.isDisplayOnly ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className="text-foreground">
                              {course.assignedStaff}h
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {course.isDisplayOnly ? (
                            <Badge variant="outline">Display Only</Badge>
                          ) : course.assignedStaff >= course.requiredHours ? (
                            <Badge variant="success">Fully Staffed</Badge>
                          ) : (
                            <Badge variant="warning">
                              Need {course.requiredHours - course.assignedStaff}
                              h More
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
