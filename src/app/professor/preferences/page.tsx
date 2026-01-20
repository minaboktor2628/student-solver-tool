"use client";
import { auth } from "@/server/auth";
import { redirect } from "next/dist/client/components/navigation";
import { ProfessorPreferenceForm } from "@/components/professor/professor-preference-form";

export default function ProfessorPreferencesPage() {
  return <ProfessorPreferenceForm />;
}
