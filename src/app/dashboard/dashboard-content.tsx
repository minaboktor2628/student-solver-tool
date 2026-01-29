"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type { Section, User, Term } from "@prisma/client";

// Dashboard view types - extend Prisma models with computed/view-specific fields
// Database fields come from Prisma types, only computed/transformed fields defined here
// See: src/server/api/routers/dashboard.ts for transformation logic

// Course: Section model + computed fields
interface Course
  extends Pick<
    Section,
    | "id"
    | "courseCode"
    | "courseTitle"
    | "enrollment"
    | "capacity"
    | "requiredHours"
  > {
  // Computed/transformed fields (not in database)
  assignedStaff: number; // sum from assignments
  professorName: string; // flattened from professor.name
  term: string; // formatted from term.termLetter + year
  isGradSemesterCourse?: boolean; // parsed from description
  isDisplayOnly?: boolean; // parsed from description
  spansTerms?: string | null; // computed
}

// StaffMember: User model + computed fields
interface StaffMember extends Pick<User, "id" | "name" | "email" | "hours"> {
  // Computed/transformed fields
  role: string; // flattened from roles[0].role
  submitted: boolean; // from hasPreferences check
}

// Professor: User model + computed fields
interface Professor extends Pick<User, "id" | "name" | "email"> {
  // Computed fields
  submitted: boolean;
  courseCount: number;
}

// TermData: Term model + formatted fields
interface TermData extends Pick<Term, "id" | "year"> {
  // Formatted/computed fields
  name: string; // computed display name
  termLetter: string; // from Term.termLetter enum
  staffDueDate: string; // formatted from termStaffDueDate
  professorDueDate: string; // formatted from termProfessorDueDate
  status: "draft" | "published"; // from active boolean
}

const LOCAL_TERMS_KEY = "sata:terms";
const DEFAULT_TERM = "Spring 2025";

export default function DashboardContent() {
  const router = useRouter();

  // UI state
  const [selectedView, setSelectedView] = useState("overview");
  const [courses, setCourses] = useState<Course[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Term state
  const [terms, setTerms] = useState<TermData[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [loadingTerms, setLoadingTerms] = useState(false);

  // tRPC mutations and queries
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
    fetchTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTerms = async () => {
    setLoadingTerms(true);
    try {
      const { data } = await getTermsQuery.refetch();
      if (data) {
        const formattedTerms = data.terms.map((term: any) => ({
          id: term.id,
          name: term.name,
          termLetter: term.termLetter,
          year: term.year,
          staffDueDate: term.staffDueDate,
          professorDueDate: term.professorDueDate,
          status: (term.active ? "published" : "draft") as
            | "draft"
            | "published",
        }));
        setTerms(formattedTerms);
        if (formattedTerms.length > 0 && formattedTerms[0]) {
          setSelectedTerm(formattedTerms[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching terms:", err);
      // Fallback to local storage if API fails
      const raw = localStorage.getItem(LOCAL_TERMS_KEY);
      const parsed: string[] | null = raw ? JSON.parse(raw) : null;
      const initialTerms =
        Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_TERM];
      setTerms(
        initialTerms.map((name) => ({
          id: name,
          name,
          termLetter: "A",
          year: new Date().getFullYear(),
          staffDueDate: "",
          professorDueDate: "",
          status: "published",
        })),
      );
      setSelectedTerm(initialTerms[0] ?? DEFAULT_TERM);
    } finally {
      setLoadingTerms(false);
    }
  };

  // Fetch dashboard data when term changes
  useEffect(() => {
    if (selectedTerm) {
      fetchDashboardData(selectedTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTerm]);

  const fetchDashboardData = async (termId: string) => {
    setIsLoading(true);
    try {
      const { data } = await getDashboardQuery.refetch();

      if (!data) {
        console.error("Dashboard API error");
        setSyncMessage(`✗ Dashboard API error`);
        setCourses([]);
        setStaff([]);
        setProfessors([]);
        return;
      }

      // Transform courses with graduate semester course handling
      const transformedCourses = (data.courses ?? []).map((course: any) => {
        // Check if it's a graduate semester course
        const isGradSemester = course.description?.includes("GRAD_SEMESTER");
        const isDisplayOnly = course.description?.includes(
          "GRAD_SEMESTER_SECONDARY",
        );

        // Debug logging for ALL courses to see what we're getting
        console.log(
          `Course: ${course.courseCode} - Description: "${course.description}" - isGradSemester: ${isGradSemester} - isDisplayOnly: ${isDisplayOnly}`,
        );

        // Determine term display
        let termDisplay = course.term ?? "Unknown Term";
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
          id: course.id,
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          enrollment: course.enrollment,
          capacity: course.capacity,
          requiredHours: isDisplayOnly ? 0 : course.requiredHours, // 0 for display-only
          assignedStaff: course.assignedHours,
          professorName: course.professorName,
          term: termDisplay,
          isGradSemesterCourse: isGradSemester,
          isDisplayOnly: isDisplayOnly,
          spansTerms: spansTerms,
        };
      });

      setCourses(transformedCourses);
      setStaff(
        (data.staff ?? []).map((s: any) => ({
          ...s,
          role: s.roles?.[0] ?? "PLA",
          submitted: s.hasPreferences,
        })),
      );
      setProfessors(
        (data.professors ?? []).map((p: any) => ({
          ...p,
          submitted: true,
        })),
      );
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setSyncMessage("✗ Failed to load dashboard data");
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
        setSyncMessage("✓ Term published successfully!");
        fetchTerms();
      } else {
        setSyncMessage(`✗ Failed to publish term`);
      }
    } catch (err) {
      console.error("Error publishing term:", err);
      setSyncMessage("✗ Failed to publish term");
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
        setSyncMessage("✓ Term deleted successfully!");
        await fetchTerms();
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
        setSyncMessage(`✗ Failed to delete term`);
      }
    } catch (err) {
      console.error("Error deleting term:", err);
      setSyncMessage("✗ Failed to delete term");
    }
  };

  // Sync courses function (existing)
  const syncCoursesFromWPI = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const response = await syncCoursesMutation.mutateAsync();
      if (response && (response.success ?? response.created !== undefined)) {
        setSyncMessage(
          `✓ Synced! Created: ${response.created ?? 0}, Updated: ${response.updated ?? 0}, Skipped: ${response.skipped ?? 0}`,
        );
        if (selectedTerm) {
          await fetchDashboardData(selectedTerm);
        }
      } else {
        setSyncMessage(`✗ Sync failed`);
      }
    } catch (err: any) {
      console.error("Error syncing courses:", err);
      setSyncMessage("✗ Sync failed");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
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
  const totalAvailableHours = staff.reduce((sum, s) => sum + (s.hours || 0), 0);
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
      setSyncMessage("✗ No emails to copy");
      setTimeout(() => setSyncMessage(null), 3000);
      return;
    }

    const text = emails.join(", ");
    navigator.clipboard.writeText(text).then(() => {
      setSyncMessage(
        `✓ Copied ${emails.length} email${emails.length > 1 ? "s" : ""} to clipboard`,
      );
      setTimeout(() => setSyncMessage(null), 3000);
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
                  ? `${terms.find((t) => t.id === selectedTerm)?.name || selectedTerm} • Course Assignment Overview`
                  : "Select a term"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm">
                <label className="text-muted-foreground mb-1 block text-xs">
                  Term
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTerm || ""}
                    onChange={(e) => setSelectedTerm(e.target.value || null)}
                    disabled={loadingTerms}
                    className="rounded border px-3 py-2 text-sm"
                  >
                    {loadingTerms ? <option>Loading…</option> : null}
                    {!loadingTerms &&
                      terms.map((term) => (
                        <option key={term.id} value={term.id}>
                          {term.name} {term.status === "draft" && "(Draft)"}
                        </option>
                      ))}
                  </select>

                  {selectedTerm && (
                    <button
                      onClick={() => deleteTerm(selectedTerm)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded px-3 py-2 text-sm"
                      title="Delete term"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  <Link
                    href="/dashboard/create-term"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded px-3 py-2 text-sm"
                  >
                    <Plus className="h-4 w-4" /> Create Term
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedTerm &&
          terms.find((t) => t.id === selectedTerm)?.status === "draft" && (
            <div className="mb-6">
              <button
                onClick={() => publishTerm(selectedTerm)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded px-4 py-2"
              >
                <Calendar className="h-4 w-4" /> Publish Term
              </button>
              <p className="text-muted-foreground mt-1 text-sm">
                Once published, staff and professors can submit preferences
              </p>
            </div>
          )}

        {syncMessage && (
          <div
            className={`mb-6 rounded-lg p-4 ${syncMessage.startsWith("✓") ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200" : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"}`}
          >
            {syncMessage}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card border-border rounded-lg border p-6 shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <Users className="text-primary h-8 w-8" />
              <span className="text-foreground text-2xl font-bold">
                {staff.filter((s) => s.submitted).length}/{staff.length}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Staff Submissions
            </p>
            <div className="bg-muted mt-3 h-2 rounded-full">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${staffSubmissionRate}%` }}
              />
            </div>
          </div>

          <div className="bg-card border-border rounded-lg border p-6 shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <span className="text-foreground text-2xl font-bold">
                {professors.filter((p) => p.submitted).length}/
                {professors.length}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Professor Submissions
            </p>
            <div className="bg-muted mt-3 h-2 rounded-full">
              <div
                className="h-2 rounded-full bg-green-500 transition-all"
                style={{ width: `${profSubmissionRate}%` }}
              />
            </div>
          </div>

          <div className="bg-card border-border rounded-lg border p-6 shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <Clock className="h-8 w-8 text-purple-500" />
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
          </div>

          <div className="bg-card border-border rounded-lg border p-6 shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <span className="text-foreground text-2xl font-bold">
                {staffingGap}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Staffing Gap
            </p>
            <p className="text-muted-foreground mt-2 text-xs">Hours needed</p>
          </div>
        </div>

        <div className="border-border mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="border-border flex gap-2 border-b">
            {["overview", "pending", "courses"].map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-4 py-2 font-medium capitalize transition-colors ${
                  selectedView === view
                    ? "text-primary border-primary border-b-2"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* User Management Button - Shows in all views */}
            <Link href="/dashboard/manage-users">
              <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors">
                <UserPlus className="h-4 w-4" /> Manage Users
              </button>
            </Link>

            {/* Course Management Button - Shows in courses view or always */}
            <Link href="/dashboard/manage-courses">
              <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors">
                <BookOpen className="h-4 w-4" /> Manage Courses
              </button>
            </Link>

            {selectedView === "courses" && (
              <button
                onClick={syncCoursesFromWPI}
                disabled={isSyncing}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
              >
                <Database
                  className={`h-4 w-4 ${isSyncing ? "animate-pulse" : ""}`}
                />
                {isSyncing ? "Syncing..." : "Sync from WPI"}
              </button>
            )}
          </div>
        </div>

        {selectedView === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-card border-border rounded-lg border p-6 shadow">
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
                        <div className="bg-muted h-2 w-32 rounded-full">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width:
                                total > 0
                                  ? `${(submitted / total) * 100}%`
                                  : "0%",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border-border rounded-lg border p-6 shadow">
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
                              <span className="text-xs text-blue-600">
                                ({course.spansTerms})
                              </span>
                            )}
                          </span>
                          <span
                            className={`text-sm ${isUnderstaffed ? "text-orange-500" : "text-green-500"}`}
                          >
                            {course.assignedStaff}/{course.requiredHours}h
                          </span>
                        </div>
                        <div className="bg-muted h-1.5 w-full rounded-full">
                          <div
                            className={`h-1.5 rounded-full ${isUnderstaffed ? "bg-orange-500" : "bg-green-500"}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {selectedView === "pending" && (
          <div className="space-y-6">
            <div className="bg-card border-border rounded-lg border shadow">
              <div className="border-border border-b p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-foreground text-xl font-semibold">
                    Pending Staff Submissions ({pendingStaff.length})
                  </h2>
                  {pendingStaff.length > 0 && (
                    <button
                      onClick={() => copyEmailsToClipboard(pendingStaff)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 transition-colors"
                    >
                      <Mail className="h-4 w-4" /> Copy Emails
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
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
                        <XCircle className="h-5 w-5 text-red-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border-border rounded-lg border shadow">
              <div className="border-border border-b p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-foreground text-xl font-semibold">
                    Pending Professor Submissions ({pendingProfessors.length})
                  </h2>
                  {pendingProfessors.length > 0 && (
                    <button
                      onClick={() => copyEmailsToClipboard(pendingProfessors)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 transition-colors"
                    >
                      <Mail className="h-4 w-4" /> Copy Emails
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
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
                        <XCircle className="h-5 w-5 text-red-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedView === "courses" && (
          <div className="bg-card border-border rounded-lg border shadow">
            <div className="border-border border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-foreground text-xl font-semibold">
                    Course Details
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {courses.filter((c) => !c.isDisplayOnly).length} CS courses
                    in database
                    {courses.filter((c) => c.isDisplayOnly).length > 0 && (
                      <span className="ml-2 text-gray-500">
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
                              ? "bg-gray-50"
                              : "bg-blue-50"
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
                                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                    <Calendar className="mr-1 h-3 w-3" />
                                    Semester ({course.spansTerms})
                                  </span>
                                )}
                              {course.isDisplayOnly && (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                                  <Eye className="mr-1 h-3 w-3" />
                                  Display Only
                                </span>
                              )}
                            </div>
                            <div className="text-muted-foreground mt-1 text-sm">
                              {course.courseTitle}
                              {course.isDisplayOnly && (
                                <span className="ml-2 text-xs text-gray-500">
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
                            <span className="text-gray-400">—</span>
                          ) : (
                            `${course.requiredHours}h`
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {course.isDisplayOnly ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            `${course.assignedStaff}h`
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {course.isDisplayOnly ? (
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                              Display Only
                            </span>
                          ) : course.assignedStaff >= course.requiredHours ? (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                              Fully Staffed
                            </span>
                          ) : (
                            <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                              Need {course.requiredHours - course.assignedStaff}
                              h More
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
