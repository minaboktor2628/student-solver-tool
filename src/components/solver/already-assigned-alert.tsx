import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

export type AlreadyAssignedAlertProps = {
  staffName: string;
  fromCourse: string;
  toCourse: string;
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
  onDontShowAgain: () => void;
};
export function AleadyAssignedAlert({
  toCourse,
  fromCourse,
  staffName,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  onDontShowAgain,
}: AlreadyAssignedAlertProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This staff is already assigned to course {fromCourse}. Pressing
            Continue will remove {staffName} from {fromCourse} and assign them
            to {toCourse}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center gap-3">
          <Checkbox id="showagain" onClick={onDontShowAgain} />
          <Label htmlFor="showagain">Don&apos;t show this warning again</Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
