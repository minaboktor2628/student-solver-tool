"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/dist/client/link";
import { api } from "@/trpc/react";
import type {
  SectionWithProfessorPreference,
  Assistant,
  TimesRequiredOutput,
  dayEnum,
} from "@/types/professor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";

import { Button } from "../../ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "../../loading-spinner";
import { SelectAssistantPref } from "./select-assistant-pref";
import { SelectAssistantAntipref } from "./select-assistant-antipref";
import { SelectRequiredTimes } from "./select-required-times";
import { FormEntryComments } from "./comment-box";

interface ProfessorPreferenceFormProps {
  userId: string;
}

const ProfessorPreferenceForm: React.FC<ProfessorPreferenceFormProps> = ({
  userId,
}) => {
  const [preferredStaff, setPreferredStaff] = useState<
    Record<string, Assistant[]>
  >({});
  const [avoidedStaff, setAvoidedStaff] = useState<Record<string, Assistant[]>>(
    {},
  );
  const [timesRequired, setTimesRequired] = useState<
    Record<string, TimesRequiredOutput[]>
  >({});
  const [comments, setComments] = useState<string | null | undefined>();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data, error } =
    api.professorForm.getProfessorSectionsForTerm.useQuery({
      professorId: userId,
    });

  const [sections, setSections] =
    useState<Record<string, SectionWithProfessorPreference>>();

  useEffect(() => {
    setLoading(true);
    if (data) {
      const initialValues: Record<string, SectionWithProfessorPreference> = {};
      data?.sections.forEach((s) => {
        initialValues[s.sectionId] = {
          sectionId: s.sectionId,
          courseCode: s.courseCode,
          courseSection: s.courseSection,
          courseTitle: s.courseTitle,
          meetingPattern: s.meetingPattern,
          enrollment: s.enrollment,
          capacity: s.capacity,
          requiredHours: s.requiredHours,
          availableAssistants: s.availableAssistants.map((a) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            hours: a.hours,
            roles: a.roles,
          })),
          professorPreference: {
            preferredStaff: s.professorPreference?.preferredStaff?.map((a) => ({
              id: a.id,
              name: a.name,
              email: a.email,
              hours: a.hours,
              roles: (a.roles ?? []).map((r) => ({ role: r })),
            })),
            avoidedStaff: s.professorPreference?.avoidedStaff?.map((a) => ({
              id: a.id,
              name: a.name,
              email: a.email,
              hours: a.hours,
              roles: (a.roles ?? []).map((r) => ({ role: r })),
            })),
            timesRequired: s.professorPreference?.timesRequired?.map((a) => ({
              day: a.day,
              hour: a.hour,
            })),
            comments: s.professorPreference?.comments,
          },
        };
      });
      setSections(initialValues);
      setLoading(false);
    }
  }, [data?.sections]);

  const handlePreferredStaffChange = (
    sectionId: string,
    newPreferredStaff: Assistant[],
  ) => {
    setPreferredStaff((prev) => ({
      ...prev,
      [sectionId]: newPreferredStaff,
    }));
  };
  const handleAvoidedStaffChange = (
    sectionId: string,
    newAvoidedStaff: Assistant[],
  ) => {
    setAvoidedStaff((prev) => ({
      ...prev,
      [sectionId]: newAvoidedStaff,
    }));
  };
  const handleTimesRequiredChange = (
    sectionId: string,
    newTimesRequired: TimesRequiredOutput[],
  ) => {
    setTimesRequired((prev) => ({
      ...prev,
      [sectionId]: newTimesRequired,
    }));
  };
  const handleCommentsChange = (
    sectionId: string,
    newComments: string | null | undefined,
  ) => {
    setComments(newComments);
  };

  const dbInsertProfPreference =
    api.professorForm.updateProfessorSectionsForTerm.useMutation({
      onError: (err) => console.error("Mutation failed:", err),
    });

  const handleSubmit = () => {
    setIsSubmitting(true);
    const payload = data?.sections?.map((s) => ({
      sectionId: s.sectionId,
      professorId: userId,
    }));

    setIsSubmitted(true);
    setIsSubmitting(false);

    console.log("Submitting:", payload);
    toast.success("Preferences submitted successfully!");

    // api.sectionPreference.upsertMany.mutate(payload)
    // TODO: create mutation to submit preferences
  };
  if (loading) {
    return (
      <div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div>Error loading sections: {error.message}</div>;
  }

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
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/professor">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {Object.values(sections ?? {}).map((section) => (
            <div key={section.sectionId} className="px-4 py-2">
              <Card>
                <CardHeader>
                  <CardTitle>{section.courseTitle}</CardTitle>
                  <CardDescription>
                    {section.courseCode} - {section.courseSection}
                    <br />
                    Meeting Time: {section.meetingPattern}
                  </CardDescription>
                  <CardDescription>
                    Enrollment: {section.enrollment} / {section.capacity}
                  </CardDescription>
                  <CardDescription>
                    Potential Staff Hours: {section.requiredHours}
                  </CardDescription>
                  <SelectAssistantPref
                    sectionId={section.sectionId}
                    availableAssistants={section.availableAssistants}
                    preferredStaff={preferredStaff[section.sectionId] || []}
                    onChange={(sectionId, preferredStaff) =>
                      handlePreferredStaffChange(sectionId, preferredStaff)
                    }
                  />
                  <SelectAssistantAntipref
                    sectionId={section.sectionId}
                    availableAssistants={section.availableAssistants}
                    avoidedStaff={avoidedStaff[section.sectionId] || []}
                    onChange={(sectionId, avoidedStaff) =>
                      handleAvoidedStaffChange(sectionId, avoidedStaff)
                    }
                  />
                  <SelectRequiredTimes
                    sectionId={section.sectionId}
                    timesRequired={
                      section.professorPreference.timesRequired || []
                    }
                    onChange={(sectionId, timesRequired) =>
                      handleTimesRequiredChange(sectionId, timesRequired)
                    }
                  />
                  <FormEntryComments
                    sectionId={section.sectionId}
                    initialComment={section.professorPreference.comments}
                    onChange={(sectionId, comments) =>
                      handleCommentsChange(sectionId, comments)
                    }
                  />
                </CardHeader>
              </Card>
            </div>
          ))}
        </form>
      </div>
      <div className="my-6 flex justify-end gap-4 pb-8">
        <Link href="/professor">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Preferences"}
        </Button>
      </div>
    </div>
  );
};

export default ProfessorPreferenceForm;
