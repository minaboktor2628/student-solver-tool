"use client";
import { ChevronDownIcon, InfoIcon, X } from "lucide-react";
import { TermCombobox } from "../term-combobox";
import { Button } from "../ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "../ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useState } from "react";
import { solverStrategyMap, type SolverStrategy } from "@/lib/solver";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Confirm } from "../confirm-action-wrapper";

export type SolverPageHeaderProps = {
  termId: string;
};

export function SolverPageHeader({ termId }: SolverPageHeaderProps) {
  const [solverStrategy, setSolverStrategy] =
    useState<SolverStrategy>("greedy_v2");

  const utils = api.useUtils();

  const unAssignAllUnlockedApi =
    api.assignment.removeAllUnlockedAssignments.useMutation({
      onSuccess: () => {
        toast.success("Successfully unassigned all unlocked staff!");
      },
      onError: (err) => {
        toast.error(err.message);
      },
      onSettled: async () => {
        await Promise.all([
          utils.courses.getAllCoursesForTerm.invalidate({ termId }),
          utils.staff.getStaffForSection.invalidate(),
          utils.dashboard.getAssignments.invalidate(),
        ]);
      },
    });

  const solverApi = api.assignment.solve.useMutation({
    onSuccess: () => {
      toast.success("Successfully solved!");
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSettled: async () => {
      await Promise.all([
        utils.courses.getAllCoursesForTerm.invalidate({ termId }),
        utils.staff.getStaffForSection.invalidate(),
        utils.dashboard.getAssignments.invalidate(),
      ]);
    },
  });

  function handleSolve() {
    solverApi.mutate({ termId, solverStrategy });
  }

  return (
    <div className="flex items-center px-4">
      <h1 className="pr-2 font-bold">Term: </h1> <TermCombobox />
      <ButtonGroup className="ml-auto">
        <ButtonGroup>
          <Confirm action={() => unAssignAllUnlockedApi.mutate({ termId })}>
            <Button
              size="sm"
              variant="destructive"
              title="Unassign all staff on all sections who are not locked to that section."
            >
              <X /> Remove all unlocked
            </Button>
          </Confirm>
        </ButtonGroup>
        <ButtonGroup>
          <Button
            size="sm"
            onClick={handleSolve}
            disabled={solverApi.isPending}
          >
            Solve ({solverStrategyMap[solverStrategy].label})
          </Button>
          <ButtonGroupSeparator />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={solverStrategy}
                  onValueChange={(value) =>
                    setSolverStrategy(value as SolverStrategy)
                  }
                >
                  {Object.entries(solverStrategyMap).map(([key, val]) => (
                    <DropdownMenuRadioItem key={key} value={key}>
                      {val.label}
                      <Tooltip>
                        <TooltipTrigger className="ml-auto">
                          <InfoIcon />
                        </TooltipTrigger>
                        <TooltipContent>{val.description}</TooltipContent>
                      </Tooltip>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
        <ButtonGroup>
          <Button size="sm" asChild>
            <Link href="/dashboard">Done</Link>
          </Button>
        </ButtonGroup>
      </ButtonGroup>
    </div>
  );
}
