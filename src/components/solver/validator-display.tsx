"use client";

import { api } from "@/trpc/react";

type ValidatorDisplayProps = { termId: string };

export function ValidatorDisplay({ termId }: ValidatorDisplayProps) {
  return null;
}

function ValidatorStaffGotPreferences(props: ValidatorDisplayProps) {
  const [] = api.validator.staffGotPreferences.useSuspenseQuery(props);
  return null;
}
