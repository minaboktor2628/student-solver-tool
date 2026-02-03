"use client";
import { api } from "@/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UploadAllowedUsersForm } from "./upload-allowed-users-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// TODO: make this paginated
export function TermTable() {
  const [termStats] = api.term.getTermStats.useSuspenseQuery();

  const utils = api.useUtils();
  const deleteTerm = api.term.deleteTerm.useMutation({
    onSuccess: async () => {
      await utils.term.getTermStats.invalidate();
    },
  });

  const activateTerm = api.term.activateTerm.useMutation({
    onSuccess: async () => {
      await utils.term.getTermStats.invalidate();
    },
  });

  const deactivateTerm = api.term.deactivateTerm.useMutation({
    onSuccess: async () => {
      await utils.term.getTermStats.invalidate();
    },
  });

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Term Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Number of Sections</TableHead>
              <TableHead>Allowed Users</TableHead>
              <TableHead>Staff Due Date</TableHead>
              <TableHead>Professor Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {termStats.map((term) => (
              <TableRow key={term.id}>
                <TableCell className="font-medium">
                  {term.termLetter} {term.year}
                </TableCell>
                <TableCell>
                  <Badge variant={term.active ? "default" : "outline"}>
                    {term.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{term._count.sections}</TableCell>
                <TableCell>{term._count.allowedEmails}</TableCell>
                <TableCell>
                  {term.termStaffDueDate.toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {term.termProfessorDueDate.toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Sync sections</DropdownMenuItem>
                      <UploadAllowedUsersForm termId={term.id} />
                      <ActivateDeactivateButton
                        active={term.active}
                        onActivate={() => activateTerm.mutate({ id: term.id })}
                        onDeactivate={() =>
                          deactivateTerm.mutate({ id: term.id })
                        }
                      />
                      <DropdownMenuSeparator />
                      <DeleteButton
                        onClick={() => deleteTerm.mutate({ id: term.id })}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ActivateDeactivateButton({
  active,
  onActivate,
  onDeactivate,
}: {
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const isDeactivate = active;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          {isDeactivate ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDeactivate ? "Deactivate term?" : "Activate term?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDeactivate
              ? "This will deactivate the term and prevent it from being used."
              : "This will activate the term and make it available for use. Student staff and professors will be affecting this term when filling out thier preferences. Activating this term will deactivate all other term."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <AlertDialogAction onClick={isDeactivate ? onDeactivate : onActivate}>
            {isDeactivate ? "Deactivate" : "Activate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          variant="destructive"
          onSelect={(e) => e.preventDefault()}
        >
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete term?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the term
            and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onClick}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
