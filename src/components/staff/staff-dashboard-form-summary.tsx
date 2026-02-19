"use client";
import React from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { api } from "@/trpc/react";
import { BaseScheduleSelector, slotToDate } from "@/lib/schedule-selector";

interface StaffDashboardFormSummaryProps {
  userId: string;
  termId: string;
}
const StaffDashboardFormSumary: React.FC<StaffDashboardFormSummaryProps> = ({
  userId,
  termId,
}) => {
  const [data] = api.studentDashboard.getPreferencesFormData.useSuspenseQuery({
    userId,
    termId,
  });

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <span className="text-2xl font-semibold">Preferences Form Data</span>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No preferences submitted yet.</p>
        </CardContent>
      </Card>
    );
  }

  const {
    isAvailableForTerm,
    timesAvailable,
    qualifications,
    preferences,
    comments,
  } = data;

  return (
    <Card className="mb-6 gap-2">
      <CardHeader>
        <span className="text-2xl font-semibold">Preferences Form</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-xl font-semibold">
            Availability for term: {isAvailableForTerm ? "Yes" : "No"}
          </span>
        </div>

        {isAvailableForTerm && timesAvailable.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold">Times Available</h3>
            <BaseScheduleSelector
              selection={timesAvailable.map((d) => slotToDate(d))}
            />
          </div>
        )}

        {isAvailableForTerm && qualifications.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold">Qualifications</h3>
            <ul className="list-inside list-disc">
              {qualifications.map((q) => (
                <li key={q.sectionId}>
                  {q.courseCode} {q.courseSection} — {q.courseTitle}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isAvailableForTerm && preferences.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold">Preferences</h3>
            <ul className="list-inside list-disc">
              {preferences.map((p) => (
                <li key={p.sectionId}>
                  {p.courseCode} {p.courseSection} — {p.courseTitle}{" "}
                  <span className="text-muted-foreground">
                    ({p.rank === "STRONGLY_PREFER" ? "Strong" : "Prefer"})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isAvailableForTerm && (
          <div>
            <h3 className="text-lg font-semibold">Comments</h3>
            <p>{comments ?? "None"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffDashboardFormSumary;
