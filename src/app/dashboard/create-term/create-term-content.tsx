"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import { calculateRequiredAssistantHours } from "@/lib/utils";
import type { AcademicLevel } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
                        ? "bg-success text-white"
                        : "bg-muted"
                  }`}
                >
                  {step < currentStep ? "✓" : step}
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 w-12 ${step < currentStep ? "bg-success" : "bg-muted"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <Card className="px-6">
            <h2 className="text-foreground mb-4 text-xl font-semibold">
              Term Information
            </h2>

            <Alert className="border-primary/30 bg-primary/10 text-primary mb-4">
              <AlertTitle className="text-primary text-sm font-medium">
                Term Name:{" "}
                <span className="font-bold">
                  {getTermName(newTermData.termLetter, newTermData.year)}
                </span>
              </AlertTitle>
              <AlertDescription className="text-primary/70 text-xs">
                (Auto-generated from term letter and year)
              </AlertDescription>
            </Alert>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground mb-2 block text-sm">
                  Term Letter
                </Label>
                <Select
                  value={newTermData.termLetter}
                  onValueChange={(value) =>
                    setNewTermData(
                      (prev) =>
                        ({
                          ...prev,
                          termLetter: value as "A" | "B" | "C" | "D",
                        }) as typeof newTermData,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A (Fall)</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C (Spring)</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="max-w-xs">
                <Label className="text-muted-foreground mb-2 block text-sm">
                  Year
                </Label>
                <Input
                  type="number"
                  value={newTermData.year}
                  onChange={(e) =>
                    setNewTermData((prev) => ({
                      ...prev,
                      year: parseInt(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="max-w-xs">
                <Label className="text-muted-foreground mb-2 block text-sm">
                  Staff Preferences Due Date
                </Label>
                <Input
                  type="datetime-local"
                  value={newTermData.staffDueDate}
                  onChange={(e) =>
                    setNewTermData((prev) => ({
                      ...prev,
                      staffDueDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="max-w-xs">
                <Label className="text-muted-foreground mb-2 block text-sm">
                  Professor Preferences Due Date
                </Label>
                <Input
                  type="datetime-local"
                  value={newTermData.professorDueDate}
                  onChange={(e) =>
                    setNewTermData((prev) => ({
                      ...prev,
                      professorDueDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button onClick={() => window.history.back()} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleCreateTermStep1}>Next: Upload CSV</Button>
            </div>
          </Card>
        )}

        {/* Step 2: CSV Upload */}
        {currentStep === 2 && (
          <Card className="px-6">
            <h2 className="text-foreground mb-4 text-xl font-semibold">
              Upload Staff & Professor CSV
            </h2>
            <p className="text-muted-foreground mb-4">
              Upload a CSV file with columns: email, name, role (TA, PLA, or
              PROFESSOR)
            </p>

            <Input
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 10).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>{row.role}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {csvData.length > 10 && (
                    <p className="text-muted-foreground mt-2 text-sm">
                      ... and {csvData.length - 10} more rows
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <Button onClick={() => setCurrentStep(1)} variant="outline">
                Back
              </Button>
              <Button
                onClick={() => {
                  if (csvData.length > 0) {
                    setCurrentStep(3);
                    void handleFetchCourses();
                  } else {
                    toast.error("Please upload a CSV file first");
                  }
                }}
              >
                Next: Select Courses
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Course Selection */}
        {currentStep === 3 && (
          <Card className="px-6">
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
              <Button onClick={() => setIsAddingCourse(true)} size="sm">
                <Plus className="h-4 w-4" /> Add Course
              </Button>
            </div>

            {/* Add Course Form */}
            {isAddingCourse && (
              <div className="bg-muted/30 mb-4 rounded-lg border p-4">
                <h3 className="mb-3 font-semibold">Add New Course</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm">Course Code *</label>
                    <Input
                      type="text"
                      placeholder="e.g., CS 2102"
                      value={newCourse.courseCode}
                      onChange={(e) =>
                        setNewCourse((prev) => ({
                          ...prev,
                          courseCode: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Course Title *</label>
                    <Input
                      type="text"
                      placeholder="e.g., Object-Oriented Design"
                      value={newCourse.courseTitle}
                      onChange={(e) =>
                        setNewCourse((prev) => ({
                          ...prev,
                          courseTitle: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">
                      Professor Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Roman Anthony"
                      value={newCourse.professorName}
                      onChange={(e) =>
                        setNewCourse((prev) => ({
                          ...prev,
                          professorName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Enrollment *</label>
                    <Input
                      type="number"
                      value={newCourse.enrollment}
                      onChange={(e) => {
                        const enrollment = parseInt(e.target.value) ?? 0;
                        setNewCourse((prev) => ({ ...prev, enrollment }));
                      }}
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
                    <Input
                      type="number"
                      value={newCourse.capacity}
                      onChange={(e) =>
                        setNewCourse((prev) => ({
                          ...prev,
                          capacity: parseInt(e.target.value) ?? 0,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button
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
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddCourseToTerm} size="sm">
                    Add Course
                  </Button>
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
                    className="hover:bg-muted/30 flex items-center justify-between border-b p-3"
                  >
                    {editingTermCourseId === course.id ? (
                      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs">
                            Course Code *
                          </label>
                          <Input
                            type="text"
                            value={editingTermCourseData?.courseCode ?? ""}
                            onChange={(e) =>
                              setEditingTermCourseData((prev) =>
                                prev
                                  ? { ...prev, courseCode: e.target.value }
                                  : null,
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs">
                            Course Title *
                          </label>
                          <Input
                            type="text"
                            value={editingTermCourseData?.courseTitle ?? ""}
                            onChange={(e) =>
                              setEditingTermCourseData((prev) =>
                                prev
                                  ? { ...prev, courseTitle: e.target.value }
                                  : null,
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs">
                            Professor *
                          </label>
                          <Input
                            type="text"
                            value={editingTermCourseData?.professorName ?? ""}
                            onChange={(e) =>
                              setEditingTermCourseData((prev) =>
                                prev
                                  ? { ...prev, professorName: e.target.value }
                                  : null,
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs">
                            Enrollment
                          </label>
                          <Input
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
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs">Capacity</label>
                          <Input
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
                            className="text-success hover:text-success/80 p-2"
                            title="Save changes"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEditTermCourse}
                            className="text-muted-foreground hover:text-foreground p-2"
                            title="Cancel editing"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditTermCourse(course)}
                            className="text-primary hover:text-primary/80 p-2"
                            title="Edit course"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeCourseFromTerm(course.id)}
                            className="text-destructive hover:text-destructive/80 p-2"
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
              <Button onClick={() => setCurrentStep(2)} variant="outline">
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                disabled={termCoursesToInclude.length === 0}
              >
                Next: Review & Create
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Review & Create */}
        {currentStep === 4 && (
          <Card>
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
              <Button onClick={() => setCurrentStep(3)} variant="outline">
                Back
              </Button>
              <Button onClick={createTermInDatabase} disabled={creatingTerm}>
                {creatingTerm ? "Creating..." : "Create Term"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
