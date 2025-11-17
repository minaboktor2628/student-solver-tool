"use client";

import { useState } from "react";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { toast } from "sonner";

const mockCourses = [
  {
    code: "CS 1102",
    name: "Introduction to Program Design",
    tasNeeded: 2,
    meetingTime: "M-T-R-F | 10:00 AM - 10:50 AM",
  },
  {
    code: "CS 2103",
    name: "Accelerated Object-Oriented Design Concepts",
    tasNeeded: 2,
    meetingTime: "M-W-F | 2:00 PM - 2:50 PM",
  },
  {
    code: "CS 3733",
    name: "Software Engineering",
    tasNeeded: 1,
    meetingTime: "T-R | 11:00 AM - 12:20 PM",
  },
];

const mockAssistants = [
  { id: "1", name: "Alice Johnson", email: "alice@wpi.edu", type: "TA" },
  { id: "2", name: "Bob Smith", email: "bob@wpi.edu", type: "TA" },
  { id: "3", name: "Charlie Brown", email: "charlie@wpi.edu", type: "TA" },
  { id: "4", name: "Diana Prince", email: "diana@wpi.edu", type: "PLA" },
  { id: "5", name: "Eve Wilson", email: "eve@wpi.edu", type: "PLA" },
  { id: "6", name: "Frank Miller", email: "frank@wpi.edu", type: "PLA" },
];

export default function ProfessorPreferencesPage() {
  const [wantsSpecificAssistants, setWantsSpecificAssistants] = useState<
    Record<string, boolean | null>
  >({
    "CS 1102": null,
    "CS 2103": null,
    "CS 3733": null,
  });
  const [wantsSpecificTimes, setWantsSpecificTimes] = useState<
    Record<string, boolean | null>
  >({
    "CS 1102": null,
    "CS 2103": null,
    "CS 3733": null,
  });
  const [hasExcludedAssistants, setHasExcludedAssistants] = useState<
    Record<string, boolean | null>
  >({
    "CS 1102": null,
    "CS 2103": null,
    "CS 3733": null,
  });
  const [preferences, setPreferences] = useState<Record<string, string[]>>({
    "CS 1102": [],
    "CS 2103": [],
    "CS 3733": [],
  });
  const [excludedAssistants, setExcludedAssistants] = useState<
    Record<string, string[]>
  >({
    "CS 1102": [],
    "CS 2103": [],
    "CS 3733": [],
  });
  const [comments, setComments] = useState<Record<string, string>>({
    "CS 1102": "",
    "CS 2103": "",
    "CS 3733": "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAssistantChange = (
    courseCode: string,
    assistantId: string,
    selected: boolean,
  ) => {
    setPreferences((prev) => {
      const coursePrefs = prev[courseCode] || [];
      if (selected) {
        return {
          ...prev,
          [courseCode]: [...coursePrefs, assistantId],
        };
      } else {
        return {
          ...prev,
          [courseCode]: coursePrefs.filter((id) => id !== assistantId),
        };
      }
    });
  };

  const handleExcludedAssistantChange = (
    courseCode: string,
    assistantId: string,
    selected: boolean,
  ) => {
    setExcludedAssistants((prev) => {
      const courseExcluded = prev[courseCode] || [];
      if (selected) {
        return {
          ...prev,
          [courseCode]: [...courseExcluded, assistantId],
        };
      } else {
        return {
          ...prev,
          [courseCode]: courseExcluded.filter((id) => id !== assistantId),
        };
      }
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitted(true);
    setIsSubmitting(false);
    toast.success("Preferences submitted successfully!");
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="mb-4 h-16 w-16 text-green-600" />
              <h2 className="mb-2 text-2xl font-bold">
                Preferences Submitted!
              </h2>
              <p className="text-muted-foreground mb-6">
                Your assistant preferences have been successfully submitted.
              </p>
              <Link href="/professor">
                <Button>Return to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/professor">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Assistant Preferences</h1>
          <p className="text-muted-foreground mt-1">
            Select your preferred assistants for each course
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {mockCourses.map((course) => {
          const selectedAssistants = preferences[course.code] || [];
          const excludedAssistantsList = excludedAssistants[course.code] || [];
          const wantsAssistants = wantsSpecificAssistants[course.code];
          const hasExcluded = hasExcludedAssistants[course.code];
          const showAssistantList = wantsAssistants === true;
          const showExcludedList = hasExcluded === true;

          return (
            <Card key={course.code}>
              <CardHeader>
                <CardTitle>{course.code}</CardTitle>
                <CardDescription>{course.name}</CardDescription>
                <div className="mt-2 text-sm">
                  <p className="text-muted-foreground">
                    Meeting Time: {course.meetingTime}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label className="mb-3 block text-base font-medium">
                      Do you want to select specific assistants for this course?
                    </Label>
                    <p className="text-muted-foreground mb-3 text-sm">
                      You may not receive your preference
                    </p>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={
                          wantsAssistants === true ? "default" : "outline"
                        }
                        onClick={() => {
                          setWantsSpecificAssistants((prev) => ({
                            ...prev,
                            [course.code]: true,
                          }));
                        }}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={
                          wantsAssistants === false ? "default" : "outline"
                        }
                        onClick={() => {
                          setWantsSpecificAssistants((prev) => ({
                            ...prev,
                            [course.code]: false,
                          }));
                          setPreferences((prev) => ({
                            ...prev,
                            [course.code]: [],
                          }));
                        }}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  {showAssistantList && (
                    <div className="space-y-3 border-t pt-2">
                      <Label className="text-sm font-medium">
                        Select your preferred assistants
                      </Label>
                      {mockAssistants.map((assistant) => {
                        const isSelected = selectedAssistants.includes(
                          assistant.id,
                        );

                        return (
                          <div
                            key={assistant.id}
                            className={`flex items-center justify-between rounded-lg border p-3 ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Label
                                  htmlFor={`${course.code}-${assistant.id}`}
                                  className="cursor-pointer font-medium"
                                >
                                  {assistant.name}
                                </Label>
                                <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                                  {assistant.type}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-sm">
                                {assistant.email}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              id={`${course.code}-${assistant.id}`}
                              checked={isSelected}
                              onChange={(e) =>
                                handleAssistantChange(
                                  course.code,
                                  assistant.id,
                                  e.target.checked,
                                )
                              }
                              className="text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded border-gray-300"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div>
                    <Label className="mb-3 block text-base font-medium">
                      Do you want assistants to be available at specific times
                      throughout the week?
                    </Label>
                    <p className="text-muted-foreground mb-3 text-sm">
                      Only select yes if it is required for your course
                    </p>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={
                          wantsSpecificTimes[course.code] === true
                            ? "default"
                            : "outline"
                        }
                        onClick={() => {
                          setWantsSpecificTimes((prev) => ({
                            ...prev,
                            [course.code]: true,
                          }));
                        }}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={
                          wantsSpecificTimes[course.code] === false
                            ? "default"
                            : "outline"
                        }
                        onClick={() => {
                          setWantsSpecificTimes((prev) => ({
                            ...prev,
                            [course.code]: false,
                          }));
                        }}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block text-base font-medium">
                      Do you have any assistants you do not want for this
                      course?
                    </Label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={hasExcluded === true ? "default" : "outline"}
                        onClick={() => {
                          setHasExcludedAssistants((prev) => ({
                            ...prev,
                            [course.code]: true,
                          }));
                        }}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={hasExcluded === false ? "default" : "outline"}
                        onClick={() => {
                          setHasExcludedAssistants((prev) => ({
                            ...prev,
                            [course.code]: false,
                          }));
                          setExcludedAssistants((prev) => ({
                            ...prev,
                            [course.code]: [],
                          }));
                        }}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  {showExcludedList && (
                    <div className="space-y-3 border-t pt-2">
                      <Label className="text-sm font-medium">
                        Select assistants you do not want
                      </Label>
                      {mockAssistants.map((assistant) => {
                        const isExcluded = excludedAssistantsList.includes(
                          assistant.id,
                        );

                        return (
                          <div
                            key={assistant.id}
                            className={`flex items-center justify-between rounded-lg border p-3 ${
                              isExcluded
                                ? "border-destructive bg-destructive/5"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Label
                                  htmlFor={`exclude-${course.code}-${assistant.id}`}
                                  className="cursor-pointer font-medium"
                                >
                                  {assistant.name}
                                </Label>
                                <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                                  {assistant.type}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-sm">
                                {assistant.email}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              id={`exclude-${course.code}-${assistant.id}`}
                              checked={isExcluded}
                              onChange={(e) =>
                                handleExcludedAssistantChange(
                                  course.code,
                                  assistant.id,
                                  e.target.checked,
                                )
                              }
                              className="text-destructive focus:ring-destructive h-4 w-4 cursor-pointer rounded border-gray-300"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="border-t pt-2">
                    <Label
                      htmlFor={`comments-${course.code}`}
                      className="mb-3 block text-base font-medium"
                    >
                      Comments
                    </Label>
                    <Textarea
                      id={`comments-${course.code}`}
                      placeholder="Add any additional comments or notes about this course..."
                      value={comments[course.code] || ""}
                      onChange={(e) =>
                        setComments((prev) => ({
                          ...prev,
                          [course.code]: e.target.value,
                        }))
                      }
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Link href="/professor">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Preferences"}
          <Save className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
