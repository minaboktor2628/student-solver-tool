"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/dist/client/link";
import { api } from "@/trpc/react";
import SectionPreferenceCard from "./section-preference-card";
import type {
  SectionWithProfessorPreference,
  Assistant,
  WeeklySlot,
} from "@/types/professor";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function ProfessorPreferenceForm() {
  const [sections, setSections] = useState<SectionWithProfessorPreference[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const sectionsQuery =
    api.professorForm.getProfessorSectionsForTerm.useQuery();
  const assistantsQuery = api.professorForm.getAvailableAssistants.useQuery();

  useEffect(() => {
    if (!sectionsQuery.data) return;

    const mappedSections: SectionWithProfessorPreference[] =
      sectionsQuery.data?.sections.map((s) => ({
        sectionId: s.sectionId,
        courseCode: s.courseCode,
        courseSection: s.courseSection,
        courseTitle: s.courseTitle,
        meetingPattern: s.meetingPattern,
        enrollment: s.enrollment,
        capacity: s.capacity,
        requiredHours: s.requiredHours,
        availableAssistants: assistantsQuery.data || [],
        professorPreference: {
          preferredStaff: s.professorPreference.preferredStaff,
          avoidedStaff: s.professorPreference.avoidedStaff,
          timesRequired: s.professorPreference.timesRequired,
          comments: s.professorPreference.comments,
        },
      }));
    setSections(mappedSections);
  }, [sectionsQuery.data, assistantsQuery.data]);

  const updateSectionPreference = (
    sectionId: string,
    data: Partial<SectionWithProfessorPreference["professorPreference"]>,
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.sectionId === sectionId
          ? {
              ...section,
              professorPreference: {
                ...section.professorPreference,
                ...data,
              },
            }
          : section,
      ),
    );
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    const payload = sections.map((s) => ({
      sectionId: s.sectionId,
      ...s.professorPreference,
    }));

    setIsSubmitted(true);
    setIsSubmitting(false);

    console.log("Submitting:", payload);
    toast.success("Preferences submitted successfully!");
    // api.sectionPreference.upsertMany.mutate(payload)
    // TODO: create mutation to submit preferences
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
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/professor">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {sections.map((section) => (
          <SectionPreferenceCard
            key={section.sectionId}
            sectionId={section.sectionId}
            courseCode={section.courseCode}
            courseSection={section.courseSection}
            courseTitle={section.courseTitle}
            meetingPattern={section.meetingPattern}
            enrollment={section.enrollment}
            capacity={section.capacity}
            requiredHours={section.requiredHours}
            availableAssistants={section.availableAssistants}
            value={section.professorPreference}
            onChange={(data) =>
              updateSectionPreference(section.sectionId, data)
            }
          />
        ))}
      </form>
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
}

export default ProfessorPreferenceForm;
