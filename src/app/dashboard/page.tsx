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
  Plus,
  Trash2,
  Edit,
  Calendar,
  Eye,
  UserPlus,
  BookOpen,
  Save,
  X,
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
  isGradSemesterCourse?: boolean;
  isDisplayOnly?: boolean;
  spansTerms?: string | null;
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

interface TermData {
  id: string;
  name: string;
  termLetter: string;
  year: number;
  staffDueDate: string;
  professorDueDate: string;
  status: "draft" | "published";
}

interface CSVRow {
  email: string;
  name: string;
  role: "TA" | "PLA" | "PROFESSOR";
}

interface UserToAdd {
  name: string;
  email: string;
  role: "TA" | "PLA" | "PROFESSOR";
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

  // Term state
  const [terms, setTerms] = useState<TermData[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [loadingTerms, setLoadingTerms] = useState(false);

  // New term creation state
  const [isCreatingTerm, setIsCreatingTerm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [newTermData, setNewTermData] = useState({
    termLetter: "A",
    year: new Date().getFullYear(),
    staffDueDate: "",
    professorDueDate: "",
  });

  // User management state
  const [isManagingUsers, setIsManagingUsers] = useState(false);
  const [usersToAdd, setUsersToAdd] = useState<UserToAdd[]>([
    { name: "", email: "", role: "PLA" },
  ]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userManagementError, setUserManagementError] = useState<string | null>(
    null,
  );
  const [isSavingUsers, setIsSavingUsers] = useState(false);

  // Course management state (outside term creation)
  const [isManagingCourses, setIsManagingCourses] = useState(false);
  const [coursesToAdd, setCoursesToAdd] = useState<Course[]>([]);
  const [newCourse, setNewCourse] = useState({
    courseCode: "",
    courseTitle: "",
    professorName: "",
    enrollment: 0,
    capacity: 0,
    requiredHours: 0,
    description: "",
  });
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [courseManagementError, setCourseManagementError] = useState<
    string | null
  >(null);
  const [isSavingCourses, setIsSavingCourses] = useState(false);

  // EDITING STATES
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingCourseData, setEditingCourseData] = useState<Course | null>(
    null,
  );
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // For term creation: editing courses in the selection list
  const [editingTermCourseId, setEditingTermCourseId] = useState<string | null>(
    null,
  );
  const [editingTermCourseData, setEditingTermCourseData] =
    useState<Course | null>(null);

  // Calculate required hours based on enrollment
  const calculateRequiredHours = (enrollment: number): number => {
    // Round enrollment up to nearest 5
    const roundedUp = Math.ceil(enrollment / 5) * 5;
    // Divide by 2
    const divided = roundedUp / 2;
    // Round down to nearest 10
    const requiredHours = Math.floor(divided / 10) * 10;

    console.log(
      `Hours calc: enrollment=${enrollment}, roundedUp=${roundedUp}, divided=${divided}, result=${requiredHours}`,
    );
    return requiredHours;
  };

  // Auto-generate term name based on letter and year
  const getTermName = (letter: string, year: number): string => {
    switch (letter) {
      case "A":
        return `A/Fall ${year}`;
      case "B":
        return `B ${year}`;
      case "C":
        return `C/Spring ${year}`;
      case "D":
        return `D ${year}`;
      default:
        return `${letter} ${year}`;
    }
  };
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [termCoursesToInclude, setTermCoursesToInclude] = useState<Course[]>(
    [],
  );
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

  // Initialize terms from API
  useEffect(() => {
    fetchTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTerms = async () => {
    setLoadingTerms(true);
    try {
      const data = await safeFetchJson("/api/terms");
      if (data && !data.error) {
        setTerms(data.terms || []);
        if (data.terms && data.terms.length > 0) {
          setSelectedTerm(data.terms[0].id);
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
      setSelectedTerm(initialTerms[0] || DEFAULT_TERM);
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
      const data = await safeFetchJson(
        `/api/dashboard?term=${encodeURIComponent(termId)}`,
      );

      if (data?.error) {
        console.error("Dashboard API error:", data.error);
        setSyncMessage(`✗ Dashboard API error: ${String(data.error)}`);
        setCourses([]);
        setStaff([]);
        setProfessors([]);
        return;
      }

      // Transform courses with graduate semester course handling
      const transformedCourses = (data.courses || []).map((course: any) => {
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
        let termDisplay = course.term || "Unknown Term";
        let spansTerms = null;

        if (isGradSemester) {
          // Extract which terms it spans
          const isPrimary = course.description?.includes(
            "GRAD_SEMESTER_PRIMARY",
          );
          const currentTermLetter =
            terms.find((t) => t.id === termId)?.termLetter || "";

          if (currentTermLetter === "A" || currentTermLetter === "B") {
            spansTerms = "A+B";
            termDisplay = `A+B Terms ${terms.find((t) => t.id === termId)?.year || ""}`;
          } else if (currentTermLetter === "C" || currentTermLetter === "D") {
            spansTerms = "C+D";
            termDisplay = `C+D Terms ${terms.find((t) => t.id === termId)?.year || ""}`;
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
          assignedStaff: course.assignedStaff,
          professorName: course.professorName,
          term: termDisplay,
          isGradSemesterCourse: isGradSemester,
          isDisplayOnly: isDisplayOnly,
          spansTerms: spansTerms,
        };
      });

      setCourses(transformedCourses);
      setStaff(data.staff || []);
      setProfessors(data.professors || []);
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

  // CSV parsing function
  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = (lines[0] ?? "")
      .split(",")
      .map((h) => h.trim().toLowerCase());
    const emailIndex = headers.findIndex((h) => h.includes("email"));
    const nameIndex = headers.findIndex((h) => h.includes("name"));
    const roleIndex = headers.findIndex((h) => h.includes("role"));

    if (emailIndex === -1 || nameIndex === -1 || roleIndex === -1) {
      throw new Error("CSV must contain email, name, and role columns");
    }

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const rawRole = (values[roleIndex] ?? "").toString();
      const role = rawRole.toUpperCase();
      if (!rawRole) {
        throw new Error(`Missing role value in CSV row: ${line}`);
      }
      if (!["TA", "PLA", "PROFESSOR"].includes(role)) {
        throw new Error(
          `Invalid role: ${rawRole}. Must be TA, PLA, or PROFESSOR`,
        );
      }

      const emailVal = values[emailIndex] ?? "";
      const nameVal = values[nameIndex] ?? "";

      return {
        email: emailVal,
        name: nameVal,
        role: role as "TA" | "PLA" | "PROFESSOR",
      };
    });
  };

  // Step 1: Create term basic info
  const handleCreateTermStep1 = () => {
    if (!newTermData.staffDueDate || !newTermData.professorDueDate) {
      setTermError("Both due dates are required");
      return;
    }

    // Check if term already exists
    const termExists = terms.some(
      (term) =>
        term.termLetter === newTermData.termLetter &&
        term.year === newTermData.year,
    );

    if (termExists) {
      setTermError(
        `Term ${getTermName(newTermData.termLetter, newTermData.year)} already exists. Please choose a different term letter or year.`,
      );
      return;
    }

    setCurrentStep(2);
    setTermError(null);
  };

  // Step 2: Handle CSV upload
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedData = parseCSV(text);
        setCsvData(parsedData);
        setTermError(null);
      } catch (err: any) {
        setTermError(err.message);
      }
    };
    reader.readAsText(file);
  };

  // Step 3: Fetch all courses from database
  const handleFetchCourses = async () => {
    try {
      console.log("Fetching all courses from database...");

      // Fetch ALL courses from the database (not filtered by term)
      const response = await safeFetchJson("/api/courses");

      if (!response.success) {
        setTermError("Failed to fetch courses from database");
        return;
      }

      const allCourses = response.courses || [];
      console.log(`Fetched ${allCourses.length} total courses from database`);

      // Show ALL courses - let coordinator manually select which to include
      setTermCoursesToInclude(allCourses);

      if (allCourses.length === 0) {
        setTermError(
          "No courses available. Please sync courses from WPI first.",
        );
      } else {
        setTermError(null);
        console.log(
          `✅ Loaded ${allCourses.length} courses - remove any you don't want to include`,
        );
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      setTermError("Failed to load courses from database");
    }
  };

  // Add new course manually (for term creation)
  const handleAddCourseToTerm = () => {
    if (
      !newCourse.courseCode.trim() ||
      !newCourse.courseTitle.trim() ||
      !newCourse.professorName.trim()
    ) {
      setTermError("Course code, title, and professor name are required");
      return;
    }

    // Calculate required hours based on enrollment
    const calculatedHours = calculateRequiredHours(newCourse.enrollment);

    const courseToAdd: Course = {
      id: `temp-${Date.now()}`, // Temporary ID
      courseCode: newCourse.courseCode,
      courseTitle: newCourse.courseTitle,
      professorName: newCourse.professorName,
      enrollment: newCourse.enrollment,
      capacity: newCourse.capacity,
      requiredHours: calculatedHours, // Use calculated hours
      assignedStaff: 0,
      term: "",
    };

    setTermCoursesToInclude((prev) => [...prev, courseToAdd]);
    setIsAddingCourse(false);
    setNewCourse({
      courseCode: "",
      courseTitle: "",
      professorName: "",
      enrollment: 0,
      capacity: 0,
      requiredHours: 0,
      description: "",
    });
    setTermError(null);
  };

  // Edit course in term creation
  const startEditTermCourse = (course: Course) => {
    setEditingTermCourseId(course.id);
    setEditingTermCourseData({ ...course });
  };

  const cancelEditTermCourse = () => {
    setEditingTermCourseId(null);
    setEditingTermCourseData(null);
  };

  const saveEditTermCourse = () => {
    if (!editingTermCourseData) return;

    if (
      !editingTermCourseData.courseCode.trim() ||
      !editingTermCourseData.courseTitle.trim() ||
      !editingTermCourseData.professorName.trim()
    ) {
      setTermError("Course code, title, and professor name are required");
      return;
    }

    // Recalculate hours if enrollment changed
    const updatedCourse = {
      ...editingTermCourseData,
      requiredHours: calculateRequiredHours(editingTermCourseData.enrollment),
    };

    setTermCoursesToInclude((prev) =>
      prev.map((course) =>
        course.id === editingTermCourseId ? updatedCourse : course,
      ),
    );

    setEditingTermCourseId(null);
    setEditingTermCourseData(null);
    setTermError(null);
  };

  // Step 4: Create term in database
  const createTermInDatabase = async () => {
    setCreatingTerm(true);
    setTermError(null);

    try {
      const response = await safeFetchJson("/api/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTermData,
          csvData,
          courses: termCoursesToInclude,
        }),
      });

      if (response.success) {
        setSyncMessage("✓ Term created successfully!");
        setIsCreatingTerm(false);
        setCurrentStep(1);
        setNewTermData({
          termLetter: "A",
          year: new Date().getFullYear(),
          staffDueDate: "",
          professorDueDate: "",
        });
        setCsvData([]);
        setTermCoursesToInclude([]);
        fetchTerms(); // Refresh terms list
      } else {
        // Handle specific error types
        const errorMsg = response.error || "Failed to create term";

        // Check for unique constraint violations
        if (
          errorMsg.includes("Unique constraint") ||
          errorMsg.includes("unique") ||
          response.code === "P2002"
        ) {
          setTermError(
            `Term ${getTermName(newTermData.termLetter, newTermData.year)} already exists. Please go back and choose a different term letter or year.`,
          );
        } else {
          setTermError(errorMsg);
        }

        // Don't close the modal on error - let user fix it
      }
    } catch (err: any) {
      console.error("Error creating term:", err);

      // Parse error message for better user feedback
      let errorMessage = "Failed to create term";

      if (err.message) {
        if (
          err.message.includes("Unique constraint") ||
          err.message.includes("unique")
        ) {
          errorMessage = `Term ${getTermName(newTermData.termLetter, newTermData.year)} already exists. Please go back and choose a different term letter or year.`;
        } else {
          errorMessage = err.message;
        }
      }

      setTermError(errorMessage);
    } finally {
      setCreatingTerm(false);
    }
  };

  // Publish term
  const publishTerm = async (termId: string) => {
    try {
      const response = await safeFetchJson(`/api/terms/${termId}/publish`, {
        method: "POST",
      });

      if (response.success) {
        setSyncMessage("✓ Term published successfully!");
        fetchTerms();
      } else {
        setSyncMessage(`✗ Failed to publish term: ${response.error}`);
      }
    } catch (err) {
      console.error("Error publishing term:", err);
      setSyncMessage("✗ Failed to publish term");
    }
  };

  // Remove course from inclusion list (term creation)
  const removeCourseFromTerm = (courseId: string) => {
    setTermCoursesToInclude((prev) =>
      prev.filter((course) => course.id !== courseId),
    );
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
      const response = await safeFetchJson(`/api/terms?id=${termId}`, {
        method: "DELETE",
      });

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
        setSyncMessage(`✗ Failed to delete term: ${response.error}`);
      }
    } catch (err) {
      console.error("Error deleting term:", err);
      setSyncMessage("✗ Failed to delete term");
    }
  };

  // COURSE EDITING FUNCTIONS (for main dashboard)
  const startEditCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setEditingCourseData({ ...course });
  };

  const cancelEditCourse = () => {
    setEditingCourseId(null);
    setEditingCourseData(null);
  };

  const saveEditCourse = async () => {
    if (!editingCourseData || !editingCourseId) return;

    if (
      !editingCourseData.courseCode.trim() ||
      !editingCourseData.courseTitle.trim() ||
      !editingCourseData.professorName.trim()
    ) {
      setSyncMessage("✗ Course code, title, and professor name are required");
      setTimeout(() => setSyncMessage(null), 3000);
      return;
    }

    setIsSavingEdit(true);

    try {
      // Recalculate hours if enrollment changed
      const updatedCourse = {
        ...editingCourseData,
        requiredHours: calculateRequiredHours(editingCourseData.enrollment),
      };

      // Update via API - using query parameter instead of dynamic route
      const response = await safeFetchJson(
        `/api/courses?id=${editingCourseId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedCourse),
        },
      );

      if (response.success) {
        // Update local state
        setCourses((prev) =>
          prev.map((course) =>
            course.id === editingCourseId ? updatedCourse : course,
          ),
        );
        setSyncMessage("✓ Course updated successfully!");
        setEditingCourseId(null);
        setEditingCourseData(null);
      } else {
        setSyncMessage(`✗ Failed to update course: ${response.error}`);
      }
    } catch (err: any) {
      console.error("Error updating course:", err);
      setSyncMessage(
        `✗ Failed to update course: ${err.message || "Unknown error"}`,
      );
    } finally {
      setIsSavingEdit(false);
      setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this course? This will also delete any preferences and assignments associated with it. This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await safeFetchJson(`/api/courses?id=${courseId}`, {
        method: "DELETE",
      });

      if (response.success) {
        // Remove from local state
        setCourses((prev) => prev.filter((course) => course.id !== courseId));
        setSyncMessage("✓ Course deleted successfully!");
      } else {
        setSyncMessage(`✗ Failed to delete course: ${response.error}`);
      }
    } catch (err) {
      console.error("Error deleting course:", err);
      setSyncMessage("✗ Failed to delete course");
    }
  };

  // Sync courses function (existing)
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
        if (selectedTerm) {
          await fetchDashboardData(selectedTerm);
        }
      } else {
        setSyncMessage(`✗ Sync failed: ${response?.error || "unknown error"}`);
      }
    } catch (err: any) {
      console.error("Error syncing courses:", err);
      setSyncMessage("✗ Sync failed");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  // USER MANAGEMENT FUNCTIONS
  const addUserRow = () => {
    setUsersToAdd((prev) => [...prev, { name: "", email: "", role: "PLA" }]);
  };

  const updateUserRow = (
    index: number,
    field: keyof UserToAdd,
    value: string,
  ) => {
    setUsersToAdd((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value } as UserToAdd;
      return updated;
    });
  };

  const removeUserRow = (index: number) => {
    setUsersToAdd((prev) => prev.filter((_, i) => i !== index));
  };

  const saveUsers = async () => {
    setIsSavingUsers(true);
    setUserManagementError(null);

    try {
      // Validate all users
      const invalidUsers = usersToAdd.filter(
        (user) => !user.name.trim() || !user.email.trim() || !user.role,
      );

      if (invalidUsers.length > 0) {
        setUserManagementError("Please fill in all fields for each user");
        return;
      }

      // Create users via API
      const response = await safeFetchJson("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: usersToAdd }),
      });

      if (response.success) {
        setSyncMessage(`✓ Added ${usersToAdd.length} user(s) successfully!`);
        setIsManagingUsers(false);
        setUsersToAdd([{ name: "", email: "", role: "PLA" }]);
        // Refresh dashboard data if we have a selected term
        if (selectedTerm) {
          await fetchDashboardData(selectedTerm);
        }
      } else {
        setUserManagementError(response.error || "Failed to save users");
      }
    } catch (err: any) {
      console.error("Error saving users:", err);
      setUserManagementError(err.message || "Failed to save users");
    } finally {
      setIsSavingUsers(false);
    }
  };

  // COURSE MANAGEMENT FUNCTIONS (outside term creation)
  const addCourseToManage = () => {
    if (
      !newCourse.courseCode.trim() ||
      !newCourse.courseTitle.trim() ||
      !newCourse.professorName.trim()
    ) {
      setCourseManagementError(
        "Course code, title, and professor name are required",
      );
      return;
    }

    // Calculate required hours based on enrollment
    const calculatedHours = calculateRequiredHours(newCourse.enrollment);

    const courseToAdd: Course = {
      id: `temp-${Date.now()}`,
      courseCode: newCourse.courseCode,
      courseTitle: newCourse.courseTitle,
      professorName: newCourse.professorName,
      enrollment: newCourse.enrollment,
      capacity: newCourse.capacity,
      requiredHours: calculatedHours,
      assignedStaff: 0,
      term: "",
    };

    setCoursesToAdd((prev) => [...prev, courseToAdd]);
    setNewCourse({
      courseCode: "",
      courseTitle: "",
      professorName: "",
      enrollment: 0,
      capacity: 0,
      requiredHours: 0,
      description: "",
    });
    setCourseManagementError(null);
  };

  const removeCourseFromManage = (courseId: string) => {
    setCoursesToAdd((prev) => prev.filter((course) => course.id !== courseId));
  };

  const saveCourses = async () => {
    setIsSavingCourses(true);
    setCourseManagementError(null);

    try {
      if (coursesToAdd.length === 0) {
        setCourseManagementError("No courses to add");
        return;
      }

      // Save courses via API
      const response = await safeFetchJson("/api/courses/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courses: coursesToAdd,
          termId: selectedTerm, // Associate with current term if selected
        }),
      });

      if (response.success) {
        setSyncMessage(
          `✓ Added ${coursesToAdd.length} course(s) successfully!`,
        );
        setIsManagingCourses(false);
        setCoursesToAdd([]);
        // Refresh dashboard data if we have a selected term
        if (selectedTerm) {
          await fetchDashboardData(selectedTerm);
        }
      } else {
        setCourseManagementError(response.error || "Failed to save courses");
      }
    } catch (err: any) {
      console.error("Error saving courses:", err);
      setCourseManagementError(err.message || "Failed to save courses");
    } finally {
      setIsSavingCourses(false);
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

  // Term Creation Modal
  if (isCreatingTerm) {
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-foreground mb-2 text-3xl font-bold">
              Create New Term
            </h1>
            <div className="mb-4 flex gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      step === currentStep
                        ? "bg-primary text-white"
                        : step < currentStep
                          ? "bg-green-500 text-white"
                          : "bg-gray-200"
                    }`}
                  >
                    {step < currentStep ? "✓" : step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`h-1 w-12 ${step < currentStep ? "bg-green-500" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {termError && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
              {termError}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="bg-card border-border rounded-lg border p-6">
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Term Information
              </h2>

              <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm font-medium text-blue-900">
                  Term Name:{" "}
                  <span className="font-bold">
                    {getTermName(newTermData.termLetter, newTermData.year)}
                  </span>
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  (Auto-generated from term letter and year)
                </p>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-muted-foreground mb-2 block text-sm">
                    Term Letter
                  </label>
                  <select
                    value={newTermData.termLetter}
                    onChange={(e) =>
                      setNewTermData((prev) => ({
                        ...prev,
                        termLetter: e.target.value,
                      }))
                    }
                    className="w-full rounded border px-3 py-2"
                  >
                    <option value="A">A (Fall)</option>
                    <option value="B">B</option>
                    <option value="C">C (Spring)</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground mb-2 block text-sm">
                    Year
                  </label>
                  <input
                    type="number"
                    value={newTermData.year}
                    onChange={(e) =>
                      setNewTermData((prev) => ({
                        ...prev,
                        year: parseInt(e.target.value),
                      }))
                    }
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-muted-foreground mb-2 block text-sm">
                    Staff Preferences Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={newTermData.staffDueDate}
                    onChange={(e) =>
                      setNewTermData((prev) => ({
                        ...prev,
                        staffDueDate: e.target.value,
                      }))
                    }
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-2 block text-sm">
                    Professor Preferences Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={newTermData.professorDueDate}
                    onChange={(e) =>
                      setNewTermData((prev) => ({
                        ...prev,
                        professorDueDate: e.target.value,
                      }))
                    }
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsCreatingTerm(false)}
                  className="rounded border px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTermStep1}
                  className="bg-primary rounded px-4 py-2 text-white"
                >
                  Next: Upload CSV
                </button>
              </div>
            </div>
          )}

          {/* Step 2: CSV Upload */}
          {currentStep === 2 && (
            <div className="bg-card border-border rounded-lg border p-6">
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Upload Staff & Professor CSV
              </h2>
              <p className="text-muted-foreground mb-4">
                Upload a CSV file with columns: email, name, role (TA, PLA, or
                PROFESSOR)
              </p>

              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="mb-4"
              />

              {csvData.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-foreground mb-2 font-semibold">
                    Uploaded Data Preview:
                  </h3>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="border-b p-2 text-left">Name</th>
                          <th className="border-b p-2 text-left">Email</th>
                          <th className="border-b p-2 text-left">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 10).map((row, index) => (
                          <tr key={index}>
                            <td className="border-b p-2">{row.name}</td>
                            <td className="border-b p-2">{row.email}</td>
                            <td className="border-b p-2">{row.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvData.length > 10 && (
                      <p className="text-muted-foreground mt-2 text-sm">
                        ... and {csvData.length - 10} more rows
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="rounded border px-4 py-2"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (csvData.length > 0) {
                      setCurrentStep(3);
                      handleFetchCourses();
                    } else {
                      setTermError("Please upload a CSV file first");
                    }
                  }}
                  className="bg-primary rounded px-4 py-2 text-white"
                >
                  Next: Select Courses
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Course Selection */}
          {currentStep === 3 && (
            <div className="bg-card border-border rounded-lg border p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-foreground text-xl font-semibold">
                    Select Courses to Include
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    All courses from database. Add new courses or remove any
                    that shouldn't be included.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingCourse(true)}
                  className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded px-4 py-2 text-white"
                >
                  <Plus className="h-4 w-4" /> Add Course
                </button>
              </div>

              {/* Add Course Form */}
              {isAddingCourse && (
                <div className="mb-4 rounded-lg border bg-gray-50 p-4">
                  <h3 className="mb-3 font-semibold">Add New Course</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm">
                        Course Code *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., CS 2102"
                        value={newCourse.courseCode}
                        onChange={(e) =>
                          setNewCourse((prev) => ({
                            ...prev,
                            courseCode: e.target.value,
                          }))
                        }
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm">
                        Course Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Object-Oriented Design"
                        value={newCourse.courseTitle}
                        onChange={(e) =>
                          setNewCourse((prev) => ({
                            ...prev,
                            courseTitle: e.target.value,
                          }))
                        }
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm">
                        Professor Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., John Smith"
                        value={newCourse.professorName}
                        onChange={(e) =>
                          setNewCourse((prev) => ({
                            ...prev,
                            professorName: e.target.value,
                          }))
                        }
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm">Enrollment *</label>
                      <input
                        type="number"
                        value={newCourse.enrollment}
                        onChange={(e) => {
                          const enrollment = parseInt(e.target.value) || 0;
                          setNewCourse((prev) => ({ ...prev, enrollment }));
                        }}
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                      {newCourse.enrollment > 0 && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          Calculated hours:{" "}
                          {calculateRequiredHours(newCourse.enrollment)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm">Capacity</label>
                      <input
                        type="number"
                        value={newCourse.capacity}
                        onChange={(e) =>
                          setNewCourse((prev) => ({
                            ...prev,
                            capacity: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsAddingCourse(false);
                        setNewCourse({
                          courseCode: "",
                          courseTitle: "",
                          professorName: "",
                          enrollment: 0,
                          capacity: 0,
                          requiredHours: 0,
                          description: "",
                        });
                      }}
                      className="rounded border px-3 py-1.5 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCourseToTerm}
                      className="bg-primary hover:bg-primary/90 rounded px-3 py-1.5 text-sm text-white"
                    >
                      Add Course
                    </button>
                  </div>
                </div>
              )}

              {/* Course List */}
              <div className="mb-4 max-h-96 overflow-y-auto rounded border">
                {termCoursesToInclude.length === 0 ? (
                  <div className="text-muted-foreground p-8 text-center">
                    No courses loaded. Click "Add Course" to add courses
                    manually.
                  </div>
                ) : (
                  termCoursesToInclude.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between border-b p-3 hover:bg-gray-50"
                    >
                      {editingTermCourseId === course.id ? (
                        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
                          <div>
                            <label className="mb-1 block text-xs">
                              Course Code *
                            </label>
                            <input
                              type="text"
                              value={editingTermCourseData?.courseCode || ""}
                              onChange={(e) =>
                                setEditingTermCourseData((prev) =>
                                  prev
                                    ? { ...prev, courseCode: e.target.value }
                                    : null,
                                )
                              }
                              className="w-full rounded border px-2 py-1 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs">
                              Course Title *
                            </label>
                            <input
                              type="text"
                              value={editingTermCourseData?.courseTitle || ""}
                              onChange={(e) =>
                                setEditingTermCourseData((prev) =>
                                  prev
                                    ? { ...prev, courseTitle: e.target.value }
                                    : null,
                                )
                              }
                              className="w-full rounded border px-2 py-1 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs">
                              Professor *
                            </label>
                            <input
                              type="text"
                              value={editingTermCourseData?.professorName || ""}
                              onChange={(e) =>
                                setEditingTermCourseData((prev) =>
                                  prev
                                    ? { ...prev, professorName: e.target.value }
                                    : null,
                                )
                              }
                              className="w-full rounded border px-2 py-1 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs">
                              Enrollment
                            </label>
                            <input
                              type="number"
                              value={editingTermCourseData?.enrollment || 0}
                              onChange={(e) =>
                                setEditingTermCourseData((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        enrollment:
                                          parseInt(e.target.value) || 0,
                                      }
                                    : null,
                                )
                              }
                              className="w-full rounded border px-2 py-1 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs">
                              Capacity
                            </label>
                            <input
                              type="number"
                              value={editingTermCourseData?.capacity || 0}
                              onChange={(e) =>
                                setEditingTermCourseData((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        capacity: parseInt(e.target.value) || 0,
                                      }
                                    : null,
                                )
                              }
                              className="w-full rounded border px-2 py-1 text-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <p className="font-medium">
                            {course.courseCode} - {course.courseTitle}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            Professor: {course.professorName} • Enrollment:{" "}
                            {course.enrollment}/{course.capacity} • Hours:{" "}
                            {course.requiredHours}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {editingTermCourseId === course.id ? (
                          <>
                            <button
                              onClick={saveEditTermCourse}
                              className="p-2 text-green-600 hover:text-green-800"
                              title="Save changes"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditTermCourse}
                              className="p-2 text-gray-500 hover:text-gray-700"
                              title="Cancel editing"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditTermCourse(course)}
                              className="p-2 text-blue-500 hover:text-blue-700"
                              title="Edit course"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => removeCourseFromTerm(course.id)}
                              className="p-2 text-red-500 hover:text-red-700"
                              title="Remove course"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="text-muted-foreground mb-4 flex items-center justify-between text-sm">
                <span>
                  {termCoursesToInclude.length} course
                  {termCoursesToInclude.length !== 1 ? "s" : ""} selected
                </span>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="rounded border px-4 py-2"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={termCoursesToInclude.length === 0}
                  className="bg-primary rounded px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next: Review & Create
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Create */}
          {currentStep === 4 && (
            <div className="bg-card border-border rounded-lg border p-6">
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Review Term Setup
              </h2>

              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-semibold">Term Details</h3>
                  <p>
                    <strong>Name:</strong>{" "}
                    {getTermName(newTermData.termLetter, newTermData.year)}
                  </p>
                  <p>
                    <strong>Term Letter:</strong> {newTermData.termLetter}
                  </p>
                  <p>
                    <strong>Year:</strong> {newTermData.year}
                  </p>
                  <p>
                    <strong>Staff Due:</strong>{" "}
                    {new Date(newTermData.staffDueDate).toLocaleString()}
                  </p>
                  <p>
                    <strong>Professor Due:</strong>{" "}
                    {new Date(newTermData.professorDueDate).toLocaleString()}
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">People Summary</h3>
                  <p>
                    <strong>Professors:</strong>{" "}
                    {csvData.filter((row) => row.role === "PROFESSOR").length}
                  </p>
                  <p>
                    <strong>TAs:</strong>{" "}
                    {csvData.filter((row) => row.role === "TA").length}
                  </p>
                  <p>
                    <strong>PLAs:</strong>{" "}
                    {csvData.filter((row) => row.role === "PLA").length}
                  </p>
                  <p>
                    <strong>Total Courses:</strong>{" "}
                    {termCoursesToInclude.length}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="rounded border px-4 py-2"
                >
                  Back
                </button>
                <button
                  onClick={createTermInDatabase}
                  disabled={creatingTerm}
                  className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {creatingTerm ? "Creating..." : "Create Term"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // User Management Modal
  if (isManagingUsers) {
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-foreground mb-2 text-3xl font-bold">
              Manage Users
            </h1>
            <p className="text-muted-foreground">
              Add professors, TAs, and PLAs manually
            </p>
          </div>

          {userManagementError && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
              {userManagementError}
            </div>
          )}

          <div className="bg-card border-border rounded-lg border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-foreground text-xl font-semibold">
                Add Users
              </h2>
              <button
                onClick={addUserRow}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded px-4 py-2 text-white"
              >
                <UserPlus className="h-4 w-4" /> Add User Row
              </button>
            </div>

            <div className="mb-6 space-y-4">
              {usersToAdd.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-lg border bg-gray-50 p-4"
                >
                  <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm">Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., John Smith"
                        value={user.name}
                        onChange={(e) =>
                          updateUserRow(index, "name", e.target.value)
                        }
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm">Email *</label>
                      <input
                        type="email"
                        placeholder="e.g., john.smith@wpi.edu"
                        value={user.email}
                        onChange={(e) =>
                          updateUserRow(index, "email", e.target.value)
                        }
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm">Role *</label>
                      <select
                        value={user.role}
                        onChange={(e) =>
                          updateUserRow(
                            index,
                            "role",
                            e.target.value as "TA" | "PLA" | "PROFESSOR",
                          )
                        }
                        className="w-full rounded border px-3 py-2 text-sm"
                      >
                        <option value="PLA">PLA</option>
                        <option value="TA">TA</option>
                        <option value="PROFESSOR">Professor</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => removeUserRow(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                    title="Remove user"
                    disabled={usersToAdd.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="text-muted-foreground mb-6 flex items-center justify-between text-sm">
              <span>
                {usersToAdd.length} user{usersToAdd.length !== 1 ? "s" : ""} to
                add
              </span>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => {
                  setIsManagingUsers(false);
                  setUsersToAdd([{ name: "", email: "", role: "PLA" }]);
                  setUserManagementError(null);
                }}
                className="rounded border px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={saveUsers}
                disabled={isSavingUsers}
                className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {isSavingUsers ? "Saving..." : "Save Users"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Course Management Modal (outside term creation)
  if (isManagingCourses) {
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-foreground mb-2 text-3xl font-bold">
              Manage Courses
            </h1>
            <p className="text-muted-foreground">
              Add courses manually{" "}
              {selectedTerm
                ? `to ${terms.find((t) => t.id === selectedTerm)?.name || selectedTerm}`
                : ""}
            </p>
          </div>

          {courseManagementError && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
              {courseManagementError}
            </div>
          )}

          <div className="bg-card border-border rounded-lg border p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-foreground text-xl font-semibold">
                  Add Courses
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {selectedTerm
                    ? `Courses will be added to ${terms.find((t) => t.id === selectedTerm)?.name || selectedTerm}`
                    : "No term selected - courses will be added to the database without term association"}
                </p>
              </div>
              <button
                onClick={() => setIsAddingCourse(true)}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded px-4 py-2 text-white"
              >
                <BookOpen className="h-4 w-4" /> Add Course
              </button>
            </div>

            {/* Add Course Form */}
            {isAddingCourse && (
              <div className="mb-4 rounded-lg border bg-gray-50 p-4">
                <h3 className="mb-3 font-semibold">Add New Course</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm">Course Code *</label>
                    <input
                      type="text"
                      placeholder="e.g., CS 2102"
                      value={newCourse.courseCode}
                      onChange={(e) =>
                        setNewCourse((prev) => ({
                          ...prev,
                          courseCode: e.target.value,
                        }))
                      }
                      className="w-full rounded border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Course Title *</label>
                    <input
                      type="text"
                      placeholder="e.g., Object-Oriented Design"
                      value={newCourse.courseTitle}
                      onChange={(e) =>
                        setNewCourse((prev) => ({
                          ...prev,
                          courseTitle: e.target.value,
                        }))
                      }
                      className="w-full rounded border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">
                      Professor Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., John Smith"
                      value={newCourse.professorName}
                      onChange={(e) =>
                        setNewCourse((prev) => ({
                          ...prev,
                          professorName: e.target.value,
                        }))
                      }
                      className="w-full rounded border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Enrollment *</label>
                    <input
                      type="number"
                      value={newCourse.enrollment}
                      onChange={(e) => {
                        const enrollment = parseInt(e.target.value) || 0;
                        setNewCourse((prev) => ({ ...prev, enrollment }));
                      }}
                      className="w-full rounded border px-3 py-2 text-sm"
                    />
                    {newCourse.enrollment > 0 && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Calculated hours:{" "}
                        {calculateRequiredHours(newCourse.enrollment)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Capacity</label>
                    <input
                      type="number"
                      value={newCourse.capacity}
                      onChange={(e) =>
                        setNewCourse((prev) => ({
                          ...prev,
                          capacity: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsAddingCourse(false);
                      setNewCourse({
                        courseCode: "",
                        courseTitle: "",
                        professorName: "",
                        enrollment: 0,
                        capacity: 0,
                        requiredHours: 0,
                        description: "",
                      });
                    }}
                    className="rounded border px-3 py-1.5 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCourseToManage}
                    className="bg-primary hover:bg-primary/90 rounded px-3 py-1.5 text-sm text-white"
                  >
                    Add Course
                  </button>
                </div>
              </div>
            )}

            {/* Course List */}
            <div className="mb-4 max-h-96 overflow-y-auto rounded border">
              {coursesToAdd.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center">
                  No courses added yet. Click "Add Course" to add courses.
                </div>
              ) : (
                coursesToAdd.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between border-b p-3 hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {course.courseCode} - {course.courseTitle}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Professor: {course.professorName} • Enrollment:{" "}
                        {course.enrollment}/{course.capacity} • Hours:{" "}
                        {course.requiredHours}
                      </p>
                    </div>
                    <button
                      onClick={() => removeCourseFromManage(course.id)}
                      className="p-2 text-red-500 hover:text-red-700"
                      title="Remove course"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="text-muted-foreground mb-4 flex items-center justify-between text-sm">
              <span>
                {coursesToAdd.length} course
                {coursesToAdd.length !== 1 ? "s" : ""} to add
              </span>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => {
                  setIsManagingCourses(false);
                  setCoursesToAdd([]);
                  setIsAddingCourse(false);
                  setNewCourse({
                    courseCode: "",
                    courseTitle: "",
                    professorName: "",
                    enrollment: 0,
                    capacity: 0,
                    requiredHours: 0,
                    description: "",
                  });
                  setCourseManagementError(null);
                }}
                className="rounded border px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={saveCourses}
                disabled={isSavingCourses || coursesToAdd.length === 0}
                className="bg-primary rounded px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingCourses ? "Saving..." : "Save Courses"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function copyEmailsToClipboard(people: Array<{ email?: string }>): void {
    const emails = people
      .map((p) => p.email?.trim())
      .filter((e): e is string => !!e);

    if (emails.length === 0) {
      setSyncMessage("✗ No emails to copy");
      setTimeout(() => setSyncMessage(null), 3000);
      return;
    }

    const text = emails.join(", ");

    const handleSuccess = () => {
      setSyncMessage(
        `✓ Copied ${emails.length} email${emails.length > 1 ? "s" : ""} to clipboard`,
      );
      setTimeout(() => setSyncMessage(null), 3000);
    };

    const handleFailure = () => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        handleSuccess();
      } catch {
        setSyncMessage("✗ Failed to copy emails");
        setTimeout(() => setSyncMessage(null), 3000);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(handleSuccess)
        .catch(handleFailure);
    } else {
      handleFailure();
    }
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

                  <button
                    onClick={() => {
                      setIsCreatingTerm(true);
                      setCurrentStep(1);
                      setNewTermData({
                        termLetter: "A",
                        year: new Date().getFullYear(),
                        staffDueDate: "",
                        professorDueDate: "",
                      });
                      setCsvData([]);
                      setTermCoursesToInclude([]);
                      setTermError(null);
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded px-3 py-2 text-sm"
                  >
                    <Plus className="h-4 w-4" /> Create Term
                  </button>
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
            <button
              onClick={() => setIsManagingUsers(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Manage Users
            </button>

            {/* Course Management Button - Shows in courses view or always */}
            <button
              onClick={() => setIsManagingCourses(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            >
              <BookOpen className="h-4 w-4" /> Add Courses
            </button>

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
                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Actions
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
                          {editingCourseId === course.id ? (
                            <div className="flex flex-col gap-2">
                              <div>
                                <label className="text-muted-foreground mb-1 block text-xs">
                                  Course Code
                                </label>
                                <input
                                  type="text"
                                  value={editingCourseData?.courseCode || ""}
                                  onChange={(e) =>
                                    setEditingCourseData((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            courseCode: e.target.value,
                                          }
                                        : null,
                                    )
                                  }
                                  className="w-full rounded border px-2 py-1 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-muted-foreground mb-1 block text-xs">
                                  Course Title
                                </label>
                                <input
                                  type="text"
                                  value={editingCourseData?.courseTitle || ""}
                                  onChange={(e) =>
                                    setEditingCourseData((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            courseTitle: e.target.value,
                                          }
                                        : null,
                                    )
                                  }
                                  className="w-full rounded border px-2 py-1 text-sm"
                                />
                              </div>
                            </div>
                          ) : (
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
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingCourseId === course.id ? (
                            <input
                              type="text"
                              value={editingCourseData?.professorName || ""}
                              onChange={(e) =>
                                setEditingCourseData((prev) =>
                                  prev
                                    ? { ...prev, professorName: e.target.value }
                                    : null,
                                )
                              }
                              className="w-full rounded border px-2 py-1 text-sm"
                            />
                          ) : (
                            <div className="text-foreground text-sm">
                              {course.professorName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingCourseId === course.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={editingCourseData?.enrollment || 0}
                                onChange={(e) =>
                                  setEditingCourseData((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          enrollment:
                                            parseInt(e.target.value) || 0,
                                        }
                                      : null,
                                  )
                                }
                                className="w-20 rounded border px-2 py-1 text-sm"
                              />
                              <span>/</span>
                              <input
                                type="number"
                                value={editingCourseData?.capacity || 0}
                                onChange={(e) =>
                                  setEditingCourseData((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          capacity:
                                            parseInt(e.target.value) || 0,
                                        }
                                      : null,
                                  )
                                }
                                className="w-20 rounded border px-2 py-1 text-sm"
                              />
                            </div>
                          ) : (
                            <div className="text-foreground text-sm">
                              {course.enrollment}/{course.capacity}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {course.isDisplayOnly ? (
                            <span className="text-gray-400">—</span>
                          ) : editingCourseId === course.id ? (
                            <div className="flex flex-col">
                              <input
                                type="number"
                                value={editingCourseData?.requiredHours || 0}
                                onChange={(e) =>
                                  setEditingCourseData((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          requiredHours:
                                            parseInt(e.target.value) || 0,
                                        }
                                      : null,
                                  )
                                }
                                className="w-20 rounded border px-2 py-1 text-sm"
                              />
                              <span className="text-xs text-gray-500">
                                (Auto:{" "}
                                {calculateRequiredHours(
                                  editingCourseData?.enrollment || 0,
                                )}
                                h)
                              </span>
                            </div>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {editingCourseId === course.id ? (
                              <>
                                <button
                                  onClick={saveEditCourse}
                                  disabled={isSavingEdit}
                                  className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                                  title="Save changes"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={cancelEditCourse}
                                  className="p-1 text-gray-500 hover:text-gray-700"
                                  title="Cancel editing"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditCourse(course)}
                                  className="rounded bg-blue-100 p-2 text-blue-700 hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                                  title={
                                    course.isDisplayOnly
                                      ? "Cannot edit display-only courses"
                                      : "Edit course"
                                  }
                                  disabled={course.isDisplayOnly}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteCourse(course.id)}
                                  className="p-1 text-red-500 hover:text-red-700"
                                  title="Delete course"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
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
