"use client";

import { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  AlertCircle,
  RefreshCw,
  Database,
} from "lucide-react";

// Types
interface Course {
  id: string;
  courseCode: string;
  courseTitle: string;
  enrollment: number;
  capacity: number;
  requiredHours: number;
  assignedStaff: number;
  professorName: string;
  term: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  submitted: boolean;
  hours?: number;
}

interface Professor {
  id: string;
  name: string;
  email: string;
  submitted: boolean;
  courseCount: number;
}

const LOCAL_TERMS_KEY = "sata:terms";
const LOCAL_SELECTED_TERM_KEY = "sata:selectedTerm";
const DEFAULT_TERM = "Spring 2025";

export default function Dashboard() {
  // UI state
  const [selectedView, setSelectedView] = useState("overview");
  const [courses, setCourses] = useState<Course[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Local term state (no /api/terms)
  const [terms, setTerms] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [loadingTerms, setLoadingTerms] = useState(false);

  // Create term UI
  const [isCreatingTerm, setIsCreatingTerm] = useState(false);
  const [newTermName, setNewTermName] = useState("");
  const [creatingTerm, setCreatingTerm] = useState(false);
  const [termError, setTermError] = useState<string | null>(null);

  // safefetchJson utility
  async function safeFetchJson(url: string, opts?: RequestInit) {
    const res = await fetch(url, opts);
    const ct = res.headers.get("content-type") || "";

    if (!res.ok) {
      const body = ct.includes("application/json")
        ? await res.json().catch(() => null)
        : await res.text().catch(() => null);
      const err: any = new Error(
        `Request failed: ${res.status} ${res.statusText}`,
      );
      err.info = {
        url,
        status: res.status,
        statusText: res.statusText,
        contentType: ct,
        body,
      };
      throw err;
    }

    if (ct.includes("application/json") || ct.includes("application/ld+json")) {
      return res.json();
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { __raw_text: text, __contentType: ct };
    }
  }

  // Initialize local terms
  useEffect(() => {
    setLoadingTerms(true);
    try {
      const raw = localStorage.getItem(LOCAL_TERMS_KEY);
      const parsed: string[] | null = raw ? JSON.parse(raw) : null;
      const initialTerms =
        Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_TERM];

      setTerms(initialTerms);

      const persisted = localStorage.getItem(LOCAL_SELECTED_TERM_KEY);
      // Ensure this value is never `undefined` so it matches the state type (string | null)
      const initialSelected: string | null =
        persisted && initialTerms.includes(persisted)
          ? persisted
          : (initialTerms[0] ?? DEFAULT_TERM);
      setSelectedTerm(initialSelected);
    } catch (err) {
      // If localStorage is unavailable or corrupted, fall back to default single term
      console.error("Failed reading local terms, using default:", err);
      setTerms([DEFAULT_TERM]);
      setSelectedTerm(DEFAULT_TERM);
    } finally {
      setLoadingTerms(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist selected term & fetch dashboard when it changes
  useEffect(() => {
    if (selectedTerm) {
      try {
        localStorage.setItem(LOCAL_SELECTED_TERM_KEY, selectedTerm);
      } catch {}
      fetchDashboardData(selectedTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTerm]);

  // Fetch data
  const fetchDashboardData = async (term?: string | null) => {
    setIsLoading(true);
    try {
      const termParam = term || selectedTerm;
      const url = termParam
        ? `/api/dashboard?term=${encodeURIComponent(termParam)}`
        : "/api/dashboard";
      const data = await safeFetchJson(url);

      if (data && (data.__raw_text || data.__contentType)) {
        console.error("Dashboard returned non-JSON", data);
        setSyncMessage(
          "✗ Dashboard returned non-JSON (check API). See console for details.",
        );
        setCourses([]);
        setStaff([]);
        setProfessors([]);
        return;
      }

      if (data?.error) {
        console.error("Dashboard API error:", data.error);
        setSyncMessage(`✗ Dashboard API error: ${String(data.error)}`);
        setCourses([]);
        setStaff([]);
        setProfessors([]);
        return;
      }

      setCourses(data.courses || []);
      setStaff(data.staff || []);
      setProfessors(data.professors || []);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      if (err?.info) console.error("Response debug:", err.info);
      setSyncMessage(
        "✗ Failed to load dashboard data — see console/network tab for details.",
      );
      setCourses([]);
      setStaff([]);
      setProfessors([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync courses
  const syncCoursesFromWPI = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const response = await safeFetchJson("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: selectedTerm }),
      });

      if (response && (response.success || response.created !== undefined)) {
        setSyncMessage(
          `✓ Synced! Created: ${response.created ?? 0}, Updated: ${response.updated ?? 0}, Skipped: ${response.skipped ?? 0}`,
        );
        await fetchDashboardData(selectedTerm);
      } else if (response && response.__raw_text) {
        setSyncMessage(
          "✗ Sync returned non-JSON. See console for response text.",
        );
        console.error("Sync returned raw text:", response.__raw_text);
      } else {
        setSyncMessage(
          `✗ Sync failed: ${(response && (response.error || response.message)) || "unknown error"}`,
        );
      }
    } catch (err: any) {
      console.error("Error syncing courses:", err);
      if (err?.info) console.error("Response debug:", err.info);
      setSyncMessage("✗ Sync failed: Network or server error. See console.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  // Create term (local only)
  const createTerm = async () => {
    setTermError(null);
    const name = newTermName.trim();
    if (!name) {
      setTermError("Term name is required");
      return;
    }

    if (terms.includes(name)) {
      setTermError("A term with that name already exists");
      return;
    }

    setCreatingTerm(true);
    try {
      const newTerms = [name, ...terms];
      setTerms(newTerms);
      try {
        localStorage.setItem(LOCAL_TERMS_KEY, JSON.stringify(newTerms));
      } catch (e) {
        console.warn("Failed persisting terms locally", e);
      }
      setSelectedTerm(name);
      setNewTermName("");
      setIsCreatingTerm(false);
    } catch (err) {
      console.error("Error creating local term:", err);
      setTermError("Failed to create term locally");
    } finally {
      setCreatingTerm(false);
    }
  };

  // Utilities
  const copyEmailsToClipboard = (people: Array<{ email: string }>) => {
    const emails = people.map((p) => p.email).join(", ");
    try {
      navigator.clipboard.writeText(emails);
      alert("Emails copied to clipboard!");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = emails;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      alert("Emails copied to clipboard!");
    }
  };

  // Calculated stats
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
  const staffingGap = courses.reduce(
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

  // Main UI
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-foreground mb-2 text-3xl font-bold sm:text-4xl">
                SATA Coordinator Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                {selectedTerm
                  ? `${selectedTerm} • Course Assignment Overview`
                  : `${DEFAULT_TERM} • Course Assignment Overview`}
              </p>
            </div>

            {/* Term selector / create (local-only) */}
            <div className="flex items-center gap-3">
              <div className="text-sm">
                <label className="text-muted-foreground mb-1 block text-xs">
                  Term
                </label>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedTerm ?? ""}
                    onChange={(e) => setSelectedTerm(e.target.value || null)}
                    disabled={loadingTerms}
                    className="rounded border px-3 py-2 text-sm"
                  >
                    {loadingTerms ? <option>Loading…</option> : null}
                    {!loadingTerms && terms.length === 0 ? (
                      <option value="">{DEFAULT_TERM}</option>
                    ) : null}
                    {!loadingTerms &&
                      terms.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                  </select>

                  <button
                    onClick={() => {
                      setIsCreatingTerm((prev) => !prev);
                      setNewTermName("");
                      setTermError(null);
                    }}
                    className="rounded border px-3 py-2 text-sm"
                    aria-expanded={isCreatingTerm}
                  >
                    {isCreatingTerm ? "Cancel" : "New term"}
                  </button>
                </div>

                {isCreatingTerm && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={newTermName}
                      onChange={(e) => setNewTermName(e.target.value)}
                      placeholder="e.g. Fall 2025"
                      className="rounded border px-3 py-2 text-sm"
                      disabled={creatingTerm}
                    />
                    <button
                      onClick={createTerm}
                      disabled={creatingTerm}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-2 text-sm disabled:opacity-50"
                    >
                      {creatingTerm ? "Creating…" : "Create"}
                    </button>
                    {termError && (
                      <div className="text-sm text-red-500">{termError}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sync Message */}
        {syncMessage && (
          <div
            className={`mb-6 rounded-lg p-4 ${syncMessage.startsWith("✓") ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200" : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"}`}
          >
            {syncMessage}
          </div>
        )}

        {/* Stats Grid */}
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

        {/* Navigation Tabs */}
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

        {/* Content Sections (unchanged) */}
        {selectedView === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Staff by Role */}
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

            {/* Course Staffing Status */}
            <div className="bg-card border-border rounded-lg border p-6 shadow">
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Course Staffing Status
              </h2>
              <div className="space-y-2">
                {courses.map((course) => {
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
                        <span className="text-foreground text-sm font-medium">
                          {course.courseCode}
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
            {/* Pending Staff Submissions */}
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

            {/* Pending Professor Submissions */}
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
                    {courses.length} CS courses in database
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
                  {courses.map((course) => (
                    <tr
                      key={course.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-foreground text-sm font-medium">
                          {course.courseCode}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {course.courseTitle}
                        </div>
                      </td>
                      <td className="text-foreground px-6 py-4 text-sm whitespace-nowrap">
                        {course.professorName}
                      </td>
                      <td className="text-foreground px-6 py-4 text-sm whitespace-nowrap">
                        {course.enrollment}/{course.capacity}
                      </td>
                      <td className="text-foreground px-6 py-4 text-sm whitespace-nowrap">
                        {course.requiredHours}h
                      </td>
                      <td className="text-foreground px-6 py-4 text-sm whitespace-nowrap">
                        {course.assignedStaff}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {course.assignedStaff >= course.requiredHours ? (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                            Fully Staffed
                          </span>
                        ) : (
                          <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            Need {course.requiredHours - course.assignedStaff}h
                            More
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
