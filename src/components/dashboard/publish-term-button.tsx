"use client";
import { api } from "@/trpc/react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Calendar } from "lucide-react";
import type { ReactNode } from "react";
import { Confim } from "../confim-action-wrapper";

export function PublishTermButton({
  termId,
  children,
}: {
  termId: string;
  children?: ReactNode;
}) {
  const utils = api.useUtils();
  const publishTermMutation = api.term.publishTerm.useMutation({
    onSuccess: () => toast.success("Term published successfully!"),
    onError: (err) => console.error("Error publishing term:", err),
    onSettled: async () => {
      await Promise.all([
        utils.dashboard.invalidate(),
        utils.term.invalidate(),
      ]);
    },
  });

  function handlePublish() {
    publishTermMutation.mutate({ id: termId });
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Confim action={handlePublish}>
          {children ?? (
            <Button>
              <Calendar className="h-4 w-4" /> Publish Term
            </Button>
          )}
        </Confim>
      </TooltipTrigger>
      <TooltipContent>
        <p>Once published, staff and professors can see their assignments.</p>
      </TooltipContent>
    </Tooltip>
  );
}
