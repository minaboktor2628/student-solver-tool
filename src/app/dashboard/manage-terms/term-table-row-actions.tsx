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
import type { TermRow } from "./columns";
import { api } from "@/trpc/react";
import { toast } from "sonner";
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

export function TermTableRowActions({ term }: { term: TermRow }) {
  const utils = api.useUtils();

  const deleteTerm = api.term.deleteTerm.useMutation({
    onSuccess: async () => {
      toast.success("Term deleted.");
      await utils.term.getTermStats.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSettled: async () => {
      await utils.term.invalidate();
    },
  });

  const publishTerm = api.term.publishTerm.useMutation({
    onSuccess: async () => {
      toast.success("Term published.");
      await Promise.all([
        utils.dashboard.invalidate(),
        utils.term.getTermStats.invalidate(),
        utils.term.getAllTerms.invalidate(),
        utils.term.invalidate(),
      ]);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const lockAll = api.staff.lockAllStaffPreferences.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      await utils.staff.getAllUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const unlockAll = api.staff.unlockAllStaffPreferences.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      await utils.staff.getAllUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const activateTerm = api.term.activateTerm.useMutation({
    onSuccess: async () => {
      await utils.term.getTermStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
    onSettled: async () => await utils.term.invalidate(),
  });

  const deactivateTerm = api.term.deactivateTerm.useMutation({
    onSuccess: async () => {
      await utils.term.getTermStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
    onSettled: async () => await utils.term.invalidate(),
  });

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
            onClick={() => publishTerm.mutate({ id: term.id })}
            disabled={publishTerm.isPending}
          >
            Publish Term
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={() => lockAll.mutate({ termId: term.id })}
            disabled={lockAll.isPending}
          >
            Lock all
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={() => unlockAll.mutate({ termId: term.id })}
            disabled={unlockAll.isPending}
          >
            Unlock all
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={() =>
              term.active
                ? deactivateTerm.mutate({ id: term.id })
                : activateTerm.mutate({ id: term.id })
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
                <AlertDialogAction
                  onClick={() => deleteTerm.mutate({ id: term.id })}
                >
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
