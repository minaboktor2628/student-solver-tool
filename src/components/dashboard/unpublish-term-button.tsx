"use client";
import { api } from "@/trpc/react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Confirm } from "../confirm-action-wrapper";

export function UnpublishTermButton({
  termId,
  children,
}: {
  termId: string;
  children?: ReactNode;
}) {
  const utils = api.useUtils();
  const unpublishTermMutation = api.term.unpublishTerm.useMutation({
    onSuccess: () => toast.success("Term unpublished successfully!"),
    onError: (err) => console.error("Error unpublishing term:", err),
    onSettled: async () => {
      await Promise.all([
        utils.dashboard.invalidate(),
        utils.term.invalidate(),
      ]);
    },
  });

  function handleUnpublish() {
    unpublishTermMutation.mutate({ id: termId });
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Confirm
          action={handleUnpublish}
          description="This term has already been unpublished. Professors and assistands were already able to see their assignments."
        >
          {children ?? (
            <Button variant="destructive">
              <TriangleAlertIcon /> Unpublish term
            </Button>
          )}
        </Confirm>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          Once unpublished, staff and professors can no longer see their
          assignments.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
