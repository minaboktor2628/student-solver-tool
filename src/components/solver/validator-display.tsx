"use client";

import { api } from "@/trpc/react";

type ValidatorDisplayProps = { termId: string };

export function ValidatorDisplay({ termId }: ValidatorDisplayProps) {
  return (
    <div>
      <ValidatorStaffGotPreferences termId={termId} />
    </div>
  );
}

function ValidatorStaffGotPreferences(props: ValidatorDisplayProps) {
  const [data] = api.validator.staffGotPreferences.useSuspenseQuery(props);
  return (
    <code>
      <pre>
        {JSON.stringify(
          data.filter((d) => d.result.status !== "GOT_PREFERENCE"),
          null,
          2,
        )}
      </pre>
    </code>
  );
}
