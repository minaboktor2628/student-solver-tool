"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontalIcon } from "lucide-react";
import { UploadAllowedUsersForm } from "@/components/dashboard/upload-allowed-users-form";
import { SyncSectionsForm } from "@/components/dashboard/sync-sections-form";
import type { TermRow, TermActions } from "./columns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenuLabel as _Ignore } from "@/components/ui/dropdown-menu";

export function TermTableRowActions({
  term,
  actions,
}: {
  term: TermRow;
  actions: TermActions;
}) {
  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontalIcon />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <UploadAllowedUsersForm termId={term.id}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              Upload users
            </DropdownMenuItem>
          </UploadAllowedUsersForm>
          <SyncSectionsForm year={term.year} termLetter={term.termLetter}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              Add section(s)
            </DropdownMenuItem>
          </SyncSectionsForm>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={() => actions.publishTerm(term.id)}
            disabled={actions.publishPending}
          >
            Publish Term
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={() => actions.lockAll(term.id)}
            disabled={actions.lockPending}
          >
            Lock all
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={() => actions.unlockAll(term.id)}
            disabled={actions.unlockPending}
          >
            Unlock all
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={() =>
              term.active
                ? actions.onDeactivate(term.id)
                : actions.onActivate(term.id)
            }
          >
            {term.active ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                variant="destructive"
              >
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete term?</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => actions.onDelete(term.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
