"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";

import { Button } from "../../ui/button";
import { toast } from "sonner";
import { SelectAssistantPref } from "./select-assistant-pref";
import { SelectRequiredTimes } from "./select-required-times";
import { FormEntryComments } from "./comment-box";
import type { Slot } from "@/lib/schedule-selector";
import { Separator } from "@/components/ui/separator";
import type { User } from "next-auth";
import { useRouter } from "next/navigation";
import type { Route } from "next";

interface ProfessorPreferenceFormProps {
  userId: string;
  termId: string;
  redirectOnComplete?: Route;
}

type SectionPrefs = {
  preferredStaff: User[];
  avoidedStaff: User[];
  timesRequired: Slot[];
  comments: string;
};

const EMPTY_PREFS: SectionPrefs = {
  preferredStaff: [],
  avoidedStaff: [],
  timesRequired: [],
  comments: "",
};

export default function ProfessorPreferenceForm({
  userId,
  termId,
  redirectOnComplete,
}: ProfessorPreferenceFormProps) {
  const router = useRouter();
  const [{ sections, availableAssistants }] =
    api.professorForm.getProfessorSectionsForTerm.useSuspenseQuery({
      termId,
      professorId: userId,
    });

  const [prefsBySection, setPrefsBySection] = useState<
    Record<string, SectionPrefs>
  >(() => {
    const initial: Record<string, SectionPrefs> = {};

    sections.forEach((section) => {
      initial[section.sectionId] = {
        preferredStaff: section.professorPreference?.preferredStaff ?? [],
        avoidedStaff: section.professorPreference?.avoidedStaff ?? [],
        timesRequired: section.professorPreference?.timesRequired ?? [],
        comments: section.professorPreference?.comments ?? "",
      };
    });

    return initial;
  });

  const updateSection = <K extends keyof SectionPrefs>(
    sectionId: string,
    key: K,
    value: SectionPrefs[K],
  ) => {
    setPrefsBySection((prev) => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] ?? EMPTY_PREFS),
        [key]: value,
      },
    }));
  };

  const mutateSections =
    api.professorForm.updateProfessorSectionsForTerm.useMutation({
      onSuccess: () => {
        toast.success("Form submitted successfully!");
        if (redirectOnComplete) router.push(redirectOnComplete);
      },
      onError: (err) => {
        console.error("Mutation failed:", err);
        toast.error("Failed to submit preferences", {
          description: err.message,
        });
      },
    });

  const handleSubmit = () => {
    if (!sections) {
      return console.error("no sections are defined");
    }

    const sectionsPayload = sections.map((section) => {
      const id = section.sectionId;
      const p = prefsBySection[id];

      return {
        sectionId: id,
        professorPreference: {
          preferredStaffId: p?.preferredStaff.map((a) => a.id) ?? [],
          avoidedStaffId: p?.avoidedStaff.map((a) => a.id) ?? [],
          timesRequired: p?.timesRequired ?? [],
          comments: p?.comments ?? "",
        },
      };
    });

    mutateSections.mutate({
      professorId: userId,
      sections: sectionsPayload,
    });
  };

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold">
          No sections assigned to you for this term. If you think this is a
          mistake, please contact the coordinator.
        </h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex flex-row content-center justify-between">
        <h1 className="text-foreground text-3xl font-bold">Preference Form</h1>
        <p className="text-muted-foreground">{sections.length} section(s)</p>
      </div>
      <div className="flex flex-col items-center justify-center">
        <form
          className="flex w-full flex-col space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {sections.map((section) => {
            const sectionId = section.sectionId;

            const prefs = prefsBySection[sectionId] ?? EMPTY_PREFS;

            const pref = prefs.preferredStaff;
            const anti = prefs.avoidedStaff;

            const prefIds = new Set(pref.map((a) => a.id));
            const antiIds = new Set(anti.map((a) => a.id));

            const availableForPref: User[] = [];
            const availableForAnti: User[] = [];

            for (const a of availableAssistants) {
              if (!antiIds.has(a.id)) availableForPref.push(a);
              if (!prefIds.has(a.id)) availableForAnti.push(a);
            }

            return (
              <div key={section.sectionId} className="px-4 py-2">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {section.courseCode}-{section.courseSection} -{" "}
                      {section.courseTitle}
                    </CardTitle>
                    <CardDescription className="flex flex-row gap-4">
                      <span>Meeting time: {section.meetingPattern}</span>
                      <span>
                        Enrollment: {section.enrollment}/{section.capacity}
                      </span>
                      <span>
                        Allocated staff help hours: {section.requiredHours}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col space-y-2">
                    <SelectAssistantPref
                      title="Do you have any assistants that you want for this section?"
                      description="You may not receive your preference."
                      sectionId={sectionId}
                      availableAssistants={availableForPref}
                      selectedStaff={pref}
                      onChange={(nextPref) =>
                        // if they somehow got an anti person into prefs, remove it
                        updateSection(
                          sectionId,
                          "preferredStaff",
                          nextPref.filter((a) => !antiIds.has(a.id)),
                        )
                      }
                    />
                    <Separator />
                    <SelectAssistantPref
                      title="Do you have any assistants that you do not want for this section?"
                      description="You will not be placed with these staff. You are not guaranteed to be assigned any help if you put too many anti-preferences."
                      sectionId={sectionId}
                      availableAssistants={availableForAnti}
                      selectedStaff={anti}
                      onChange={(nextAnti) =>
                        // if they somehow got a pref person into anti, remove it
                        updateSection(
                          sectionId,
                          "avoidedStaff",
                          nextAnti.filter((a) => !prefIds.has(a.id)),
                        )
                      }
                    />
                    <Separator />
                    <SelectRequiredTimes
                      timesRequired={prefs.timesRequired}
                      onChange={(next) =>
                        updateSection(sectionId, "timesRequired", next)
                      }
                    />
                    <Separator />
                    <FormEntryComments
                      comment={prefs.comments}
                      onChange={(next) =>
                        updateSection(sectionId, "comments", next)
                      }
                    />
                  </CardContent>
                </Card>
              </div>
            );
          })}

          <div className="flex justify-end gap-2">
            <Link href="/">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={mutateSections.isPending}>
              {mutateSections.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
