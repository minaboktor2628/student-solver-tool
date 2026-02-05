"use client";

import React, { useState } from "react";
import Link from "next/dist/client/link";
import { api } from "@/trpc/react";
import type { Assistant, TimesRequiredOutput } from "@/types/professor";
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
import { SelectAssistantPref } from "./select-assistant-pref";
import { SelectAssistantAntipref } from "./select-assistant-antipref";
import { SelectRequiredTimes } from "./select-required-times";
import { FormEntryComments } from "./comment-box";
import { useTerm } from "@/components/term-combobox";

interface ProfessorPreferenceFormProps {
  userId: string;
}

const ProfessorPreferenceForm: React.FC<ProfessorPreferenceFormProps> = ({
  userId,
}) => {
  const { active: activeTerm } = useTerm();
  if (!activeTerm) throw new Error("Term is invalid.");

  const [{ sections }] =
    api.professorForm.getProfessorSectionsForTerm.useSuspenseQuery({
      termId: activeTerm.id,
      professorId: userId,
    });

  const [preferredStaff, setPreferredStaff] = useState<
    Record<string, Assistant[]>
  >(() => {
    const initialPreferredStaff: Record<string, Assistant[]> = {};

    sections.forEach((section) => {
      initialPreferredStaff[section.sectionId] =
        section.professorPreference.preferredStaff ?? [];
    });

    return initialPreferredStaff;
  });
  const [avoidedStaff, setAvoidedStaff] = useState<Record<string, Assistant[]>>(
    () => {
      const initialAvoidedStaff: Record<string, Assistant[]> = {};

      sections.forEach((section) => {
        initialAvoidedStaff[section.sectionId] =
          section.professorPreference.avoidedStaff ?? [];
      });

      return initialAvoidedStaff;
    },
  );
  const [timesRequired, setTimesRequired] = useState<
    Record<string, TimesRequiredOutput[]>
  >(() => {
    const initialTimesRequired: Record<string, TimesRequiredOutput[]> = {};

    sections.forEach((section) => {
      initialTimesRequired[section.sectionId] =
        section.professorPreference.timesRequired ?? [];
    });

    return initialTimesRequired;
  });
  const [comments, setComments] = useState<
    Record<string, string | null | undefined>
  >(() => {
    const initialComments: Record<string, string | null | undefined> = {};

    sections.forEach((section) => {
      initialComments[section.sectionId] =
        section.professorPreference.comments ?? null;
    });

    return initialComments;
  });
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
    setComments((prev) => ({
      ...prev,
      [sectionId]: newComments,
    }));
  };

  const mutateSections =
    api.professorForm.updateProfessorSectionsForTerm.useMutation({
      onSuccess: () => {
        toast(
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-secondary border-green-200">
              <CardContent className="">
                <div className="flex flex-col items-center justify-center py-2 text-center">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                  <h2 className="text-2xl font-bold">Preferences Submitted!</h2>
                  <p className="text-muted-foreground mb-2">
                    Your assistant preferences have been successfully submitted.
                  </p>
                  <Link href="/">
                    <Button>Return to Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>,
        );
      },
      onError: (err) => {
        console.error("Mutation failed:", err);
        toast.error("Failed to submit preferences");
      },
    });

  const handleSubmit = () => {
    if (!sections) {
      return console.error("no sections are defined");
    }

    const sectionsPayload = sections.map((section) => {
      const id = section.sectionId;
      return {
        sectionId: id,
        professorPreference: {
          preferredStaffId: preferredStaff[id]?.map((a) => a.id) ?? [],
          avoidedStaffId: avoidedStaff[id]?.map((a) => a.id) ?? [],
          timesRequired: timesRequired[id] ?? [],
          comments: comments?.[id] ?? "",
        },
      };
    });

    const payload = {
      professorId: userId,
      sections: sectionsPayload,
    };

    console.log("Submitting:", payload);
    mutateSections.mutate(payload);
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="flex flex-col items-center justify-center">
        <Card className="flex w-1/2 items-center justify-center">
          <div className="w-fit px-8 py-3 text-center text-xl">
            <CardTitle>
              Professor Preference Form
              <br />
              {activeTerm.termLetter} Term {activeTerm.year}
            </CardTitle>
          </div>
        </Card>
        <form
          className="w-full"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {sections.map((section) => (
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
                    availableAssistants={section.availableAssistants.map(
                      (assistant) => ({
                        ...assistant,
                        roles: assistant.roles.map((r) => r.role),
                      }),
                    )}
                    preferredStaff={preferredStaff[section.sectionId] ?? []}
                    avoidedStaff={avoidedStaff[section.sectionId] ?? []}
                    onChange={(sectionId, preferredStaff) =>
                      handlePreferredStaffChange(sectionId, preferredStaff)
                    }
                  />
                  <SelectAssistantAntipref
                    sectionId={section.sectionId}
                    availableAssistants={section.availableAssistants.map(
                      (assistant) => ({
                        ...assistant,
                        roles: assistant.roles.map((r) => r.role),
                      }),
                    )}
                    preferredStaff={preferredStaff[section.sectionId] ?? []}
                    avoidedStaff={avoidedStaff[section.sectionId] ?? []}
                    onChange={(sectionId, avoidedStaff) =>
                      handleAvoidedStaffChange(sectionId, avoidedStaff)
                    }
                  />
                  <SelectRequiredTimes
                    sectionId={section.sectionId}
                    timesRequired={
                      section.professorPreference.timesRequired ?? []
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
        <Button onClick={handleSubmit} disabled={mutateSections.isPending}>
          {mutateSections.isPending ? "Submitting..." : "Submit Preferences"}
        </Button>
      </div>
    </div>
  );
};

export default ProfessorPreferenceForm;
