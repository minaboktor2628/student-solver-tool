"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import { calculateRequiredAssistantHours } from "@/lib/utils";
import type { AcademicLevel } from "@prisma/client";
import { toast } from "sonner";

// Types - only CSV parsing has no Prisma equivalent
interface CSVRow {
  email: string;
  name: string;
  role: string;
}

// Course type for UI display and editing - flexible to handle API responses and manual entries
type Course = {
  id: string;
  courseCode: string;
  courseTitle: string;
  professorName: string;
  enrollment: number;
  capacity: number;
  requiredHours: number;
  description: string;
  courseSection?: string;
  meetingPattern?: string;
  academicLevel?: AcademicLevel;
  termId?: string;
};

// Form input for new courses - minimal required fields for creation
type NewCourse = {
  courseCode: string;
  courseTitle: string;
  professorName: string;
  enrollment: number;
  capacity: number;
  requiredHours: number;
  description: string;
  courseSection?: string;
  meetingPattern?: string;
  academicLevel?: AcademicLevel;
};

function getTermName(letter: string, year: number): string {
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
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = (lines[0] ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase());
  const emailIndex = headers.indexOf("email");
  const nameIndex = headers.indexOf("name");
  const roleIndex = headers.indexOf("role");

  if (emailIndex === -1 || nameIndex === -1 || roleIndex === -1) {
    throw new Error("CSV must contain email, name, and role columns");
  }

  const validRoles = ["PLA", "GLA", "TA", "COORDINATOR", "PROFESSOR"];

  return lines
    .slice(1)
    .map((line, lineIndex) => {
      const values = line.split(",").map((v) => v.trim());
      const email = values[emailIndex] ?? "";
      const name = values[nameIndex] ?? "";
      const role = (values[roleIndex] ?? "").toUpperCase();

      return { email, name, role, lineIndex: lineIndex + 2 };
    })
    .filter((row) => {
      // Skip empty rows
      if (!row.email && !row.name && !row.role) {
        return false;
      }

      // Validate that row has all required fields
      if (!row.email || !row.name || !row.role) {
        throw new Error(
          `Row ${row.lineIndex} is missing required fields (email, name, or role). All three fields are required.`,
        );
      }

      // Validate role is one of the valid options
      if (!validRoles.includes(row.role)) {
        throw new Error(
          `Row ${row.lineIndex} has invalid role "${row.role}". Must be one of: ${validRoles.join(", ")}`,
        );
      }

      return true;
    })
    .map(({ lineIndex: _lineIndex, ...row }) => row);
}

export default function CreateTermContent() {
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [newTermData, setNewTermData] = useState<{
    termLetter: "A" | "B" | "C" | "D";
    year: number;
    staffDueDate: string;
    professorDueDate: string;
  }>({
    termLetter: "A",
    year: new Date().getFullYear(),
    staffDueDate: "",
    professorDueDate: "",
  });

  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [termCoursesToInclude, setTermCoursesToInclude] = useState<Course[]>(
    [],
  );
  const [creatingTerm, setCreatingTerm] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourse, setNewCourse] = useState<NewCourse>({
    courseCode: "",
    courseTitle: "",
    professorName: "",
    enrollment: 0,
    capacity: 0,
    requiredHours: 0,
    description: "",
    courseSection: "",
    meetingPattern: "",
  });
  const [editingTermCourseId, setEditingTermCourseId] = useState<string | null>(
    null,
  );
  const [editingTermCourseData, setEditingTermCourseData] =
    useState<Course | null>(null);

  // tRPC mutations
  const createTermMutation = api.term.createTerm.useMutation();
  const getAllCoursesQuery = api.courses.getAllCourses.useQuery(undefined, {
    enabled: false,
  });

  // Step 1: Validate term info
  const handleCreateTermStep1 = () => {
    if (
      !newTermData.termLetter ||
      !newTermData.year ||
      !newTermData.staffDueDate ||
      !newTermData.professorDueDate
    ) {
      toast.error("All fields are required");
      return;
    }

    setCurrentStep(2);
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
        toast.success("CSV uploaded successfully");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "An error occurred");
      }
    };
    reader.readAsText(file);
  };

  // Step 3: Fetch all courses from database
  const handleFetchCourses = async () => {
    try {
      const { data } = await getAllCoursesQuery.refetch();

      if (!data?.success) {
        toast.error("Failed to fetch courses from database");
        return;
      }

      const allCourses = (data.courses ?? []).map((course: unknown) => {
        const c = course as {
          id: string;
          courseCode: string;
          courseTitle: string;
          professorName?: string;
          enrollment: number;
          capacity: number;
          requiredHours: number;
          academicLevel?: AcademicLevel;
        };
        return {
          id: c.id,
          courseCode: c.courseCode,
          courseTitle: c.courseTitle,
          professorName: c.professorName ?? "",
          enrollment: c.enrollment,
          capacity: c.capacity,
          requiredHours: c.requiredHours,
          description: "",
          academicLevel: c.academicLevel,
        } as Course;
      });

      setTermCoursesToInclude(allCourses);

      if (allCourses.length === 0) {
        toast.error("No courses available. Please sync courses first.");
      } else {
        toast.success(`Loaded ${allCourses.length} courses`);
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      toast.error("Failed to load courses from database");
    }
  };

  // Add new course manually
  const handleAddCourseToTerm = () => {
    if (
      !newCourse.courseCode.trim() ||
      !newCourse.courseTitle.trim() ||
      !newCourse.professorName.trim()
    ) {
      toast.error("Course code, title, and professor name are required");
      return;
    }

    const calculatedHours = calculateRequiredAssistantHours(
      newCourse.enrollment,
    );

    const courseToAdd: Course = {
      id: `temp-${Date.now()}`,
      courseCode: newCourse.courseCode,
      courseTitle: newCourse.courseTitle,
      professorName: newCourse.professorName,
      enrollment: newCourse.enrollment,
      capacity: newCourse.capacity ?? 0,
      requiredHours: calculatedHours,
      description: newCourse.description,
      courseSection: newCourse.courseSection,
      meetingPattern: newCourse.meetingPattern,
      academicLevel: newCourse.academicLevel,
    };

    setTermCoursesToInclude((prev) => [...prev, courseToAdd]);
    setNewCourse({
      courseCode: "",
      courseTitle: "",
      professorName: "",
      enrollment: 0,
      capacity: 0,
      requiredHours: 0,
      description: "",
      courseSection: "",
      meetingPattern: "",
    });
    setIsAddingCourse(false);
    toast.success("Course added to term");
  };

  // Edit course in term
  const startEditTermCourse = (course: Course) => {
    setEditingTermCourseId(course.id);
    setEditingTermCourseData(course);
  };

  const saveEditTermCourse = () => {
    if (!editingTermCourseData) return;

    if (
      !editingTermCourseData.courseCode.trim() ||
      !editingTermCourseData.courseTitle.trim() ||
      !editingTermCourseData.professorName.trim()
    ) {
      toast.error("Course code, title, and professor name are required");
      return;
    }

    const updatedCourse = {
      ...editingTermCourseData,
      requiredHours: calculateRequiredAssistantHours(
        editingTermCourseData.enrollment,
      ),
    };

    setTermCoursesToInclude((prev) =>
      prev.map((course) =>
        course.id === editingTermCourseId ? updatedCourse : course,
      ),
    );

    setEditingTermCourseId(null);
    setEditingTermCourseData(null);
    toast.success("Course updated");
  };

  const cancelEditTermCourse = () => {
    setEditingTermCourseId(null);
    setEditingTermCourseData(null);
  };

  const removeCourseFromTerm = (courseId: string) => {
    setTermCoursesToInclude((prev) =>
      prev.filter((course) => course.id !== courseId),
    );
    toast.success("Course removed from term");
  };

  // Step 4: Create term in database
  const createTermInDatabase = async () => {
    setCreatingTerm(true);

    try {
      const response = await createTermMutation.mutateAsync({
        termLetter: newTermData.termLetter,
        year: newTermData.year,
        staffDueDate: newTermData.staffDueDate,
        professorDueDate: newTermData.professorDueDate,
        csvData: csvData as Array<{
          email: string;
          role: "PLA" | "GLA" | "TA" | "COORDINATOR" | "PROFESSOR";
        }>,
        courses: termCoursesToInclude,
      });

      if (response.success) {
        toast.success("Term created successfully!");
        // Reset form
        setCurrentStep(1);
        setNewTermData({
          termLetter: "A",
          year: new Date().getFullYear(),
          staffDueDate: "",
          professorDueDate: "",
        });
        setCsvData([]);
        setTermCoursesToInclude([]);
      }
    } catch (err: unknown) {
      console.error("Error creating term:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create term");
    } finally {
      setCreatingTerm(false);
    }
  };

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
                    setNewTermData(
                      (prev) =>
                        ({
                          ...prev,
                          termLetter: e.target.value as "A" | "B" | "C" | "D",
                        }) as typeof newTermData,
                    )
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
                onClick={() => window.history.back()}
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
                    void handleFetchCourses();
                  } else {
                    toast.error("Please upload a CSV file first");
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
                  All courses from database. Add new courses or remove any that
                  shouldn&apos;t be included.
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
                      placeholder="e.g., Roman Anthony"
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
                        const enrollment = parseInt(e.target.value) ?? 0;
                        setNewCourse((prev) => ({ ...prev, enrollment }));
                      }}
                      className="w-full rounded border px-3 py-2 text-sm"
                    />
                    {newCourse.enrollment > 0 && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Calculated hours:{" "}
                        {calculateRequiredAssistantHours(newCourse.enrollment)}
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
                          capacity: parseInt(e.target.value) ?? 0,
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
                        courseSection: "",
                        meetingPattern: "",
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
                  No courses loaded. Click &quot;Add Course&quot; to add courses
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
                            value={editingTermCourseData?.courseCode ?? ""}
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
                            value={editingTermCourseData?.courseTitle ?? ""}
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
                            value={editingTermCourseData?.professorName ?? ""}
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
                            value={editingTermCourseData?.enrollment ?? 0}
                            onChange={(e) =>
                              setEditingTermCourseData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      enrollment: parseInt(e.target.value) ?? 0,
                                    }
                                  : null,
                              )
                            }
                            className="w-full rounded border px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs">Capacity</label>
                          <input
                            type="number"
                            value={editingTermCourseData?.capacity ?? 0}
                            onChange={(e) =>
                              setEditingTermCourseData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      capacity: parseInt(e.target.value) ?? 0,
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
                  <strong>Total Courses:</strong> {termCoursesToInclude.length}
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
